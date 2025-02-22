import { Inject, Injectable } from '@core/decorators/injectable';
import { wait, waitUntil } from '@core/utils';
import PCancelable from 'p-cancelable';

import { Animation, AnimationInfo, animationOptionsToFlags, PlayOptions, Scenario } from '../../shared/animation';
import { BoxZone } from '../../shared/polyzone/box.zone';
import { Vector3, Vector4 } from '../../shared/polyzone/vector';
import { WeaponName } from '../../shared/weapons/weapon';
import { ResourceLoader } from '../resources/resource.loader';

type AnimationTask = {
    animation?: Animation;
    scenario?: Scenario;
    play_options?: PlayOptions;
    reject: (reason: any) => void;
    resolve: (cancelled: boolean) => void;
    props: number[];
};

@Injectable()
export class AnimationService {
    @Inject(ResourceLoader)
    private resourceLoader: ResourceLoader;

    private queue: AnimationTask[] = [];

    private running = false;

    private currentAnimation: AnimationTask | null = null;

    private currentAnimationLoopResolve: () => void;

    private doAnimation(animation: AnimationInfo, forceDuration: boolean): number {
        const duration = animation.duration
            ? animation.duration
            : forceDuration
            ? 1000
            : animation.options?.repeat
            ? -1
            : GetAnimDuration(animation.dictionary, animation.name) * 1000;

        const blendInSpeed = animation.blendInSpeed ? animation.blendInSpeed : 1;
        const blendOutSpeed = animation.blendOutSpeed ? animation.blendOutSpeed : 1;
        const flags = animationOptionsToFlags(animation.options || {});
        const playbackRate = animation.playbackRate ? animation.playbackRate : 0.0;
        const lockX = animation.lockX ? animation.lockX : false;
        const lockY = animation.lockY ? animation.lockY : false;
        const lockZ = animation.lockZ ? animation.lockZ : false;

        TaskPlayAnim(
            PlayerPedId(),
            animation.dictionary,
            animation.name,
            blendInSpeed,
            blendOutSpeed,
            duration,
            flags,
            playbackRate,
            lockX,
            lockY,
            lockZ
        );

        return duration;
    }

    private async waitUntilCancelled(animation: AnimationInfo, duration: number | PCancelable<void>): Promise<boolean> {
        const ped = PlayerPedId();
        const until = async () => {
            return !IsEntityPlayingAnim(ped, animation.dictionary, animation.name, 3);
        };

        if (typeof duration === 'number') {
            return waitUntil(until, duration);
        }

        const waitUntilPromise = waitUntil(until);
        const durationPromise = async () => {
            await duration;

            return false;
        };

        const cancelled = await Promise.race([waitUntilPromise, durationPromise()]);

        waitUntilPromise.cancel();
        duration.cancel();

        return cancelled;
    }

    private async doScenario(scenario: Scenario, stop: PCancelable<void>): Promise<boolean> {
        const ped = PlayerPedId();

        ClearPedTasksImmediately(ped);
        TaskStartScenarioInPlace(ped, scenario.name, 0, true);

        const until = async () => {
            return !IsPedUsingAnyScenario(ped) || !IsPedUsingScenario(ped, scenario.name);
        };

        if (scenario.duration) {
            return waitUntil(until, scenario.duration);
        }

        const waitUntilPromise = waitUntil(until);
        const durationPromise = async () => {
            await stop;

            return false;
        };

        const cancelled = await Promise.race([waitUntilPromise, durationPromise()]);

        waitUntilPromise.cancel();
        stop.cancel();

        return cancelled;
    }

    public async loop() {
        this.running = true;

        while (this.running) {
            if (this.queue.length === 0) {
                await wait(100);

                continue;
            }

            const ped = PlayerPedId();
            const animationPromise = new PCancelable<void>(resolve => {
                this.currentAnimationLoopResolve = resolve;
            });

            this.currentAnimation = this.queue.shift();

            const options = this.currentAnimation.play_options || {
                reset_weapon: true,
            };

            let cancelled = false;

            if (this.currentAnimation.animation) {
                if (this.currentAnimation.animation.props) {
                    for (const prop of this.currentAnimation.animation.props) {
                        await this.resourceLoader.loadModel(prop.model);

                        const playerOffset = GetOffsetFromEntityInWorldCoords(ped, 0.0, 0.0, 0.0) as Vector3;
                        const propId = CreateObject(
                            GetHashKey(prop.model),
                            playerOffset[0],
                            playerOffset[1],
                            playerOffset[2],
                            true,
                            true,
                            false
                        );

                        SetEntityAsMissionEntity(propId, true, true);
                        SetNetworkIdCanMigrate(NetworkGetNetworkIdFromEntity(propId), false);

                        AttachEntityToEntity(
                            propId,
                            ped,
                            GetPedBoneIndex(ped, prop.bone),
                            prop.position[0],
                            prop.position[1],
                            prop.position[2],
                            prop.rotation[0],
                            prop.rotation[1],
                            prop.rotation[2],
                            true,
                            true,
                            false,
                            true,
                            0,
                            true
                        );

                        this.currentAnimation.props.push(propId);
                    }
                }

                if (this.currentAnimation.animation.enter) {
                    cancelled = await this.waitUntilCancelled(
                        this.currentAnimation.animation.enter,
                        this.doAnimation(this.currentAnimation.animation.enter, true)
                    );
                }

                if (!cancelled) {
                    const duration = this.doAnimation(this.currentAnimation.animation.base, false);

                    cancelled = await this.waitUntilCancelled(
                        this.currentAnimation.animation.base,
                        duration !== -1 ? duration : animationPromise
                    );
                }

                if (!cancelled && this.currentAnimation.animation.exit) {
                    cancelled = await this.waitUntilCancelled(
                        this.currentAnimation.animation.exit,
                        this.doAnimation(this.currentAnimation.animation.exit, true)
                    );
                }
            } else if (this.currentAnimation.scenario) {
                cancelled = await this.doScenario(this.currentAnimation.scenario, animationPromise);
            }

            if (options.reset_weapon) {
                SetCurrentPedWeapon(ped, GetHashKey(WeaponName.UNARMED), true);
            }

            this.currentAnimation.resolve(cancelled);

            const noClearPedTask = this.currentAnimation.play_options?.noClearPedTask;

            for (const prop of this.currentAnimation.props) {
                DetachEntity(prop, false, false);
                DeleteEntity(prop);
            }

            this.currentAnimation = null;
            this.currentAnimationLoopResolve = null;

            await wait(100);

            if (!noClearPedTask) {
                ClearPedTasks(ped);
            }
            ClearPedSecondaryTask(ped);
        }
    }

    public async walkToCoords(coords: Vector4, duration = 1000) {
        const playerPed = PlayerPedId();
        TaskGoStraightToCoord(PlayerPedId(), coords[0], coords[1], coords[2], 1.0, duration, coords[3], 0.1);

        const zone: BoxZone = new BoxZone([coords[0], coords[1], coords[2]], 1, 1);
        const interval = 500;
        for (let i = 0; i < duration - interval; i += interval) {
            if (
                zone.isPointInside(GetEntityCoords(playerPed) as Vector3) &&
                Math.abs(GetEntityHeading(playerPed) - coords[3]) < 5
            ) {
                break;
            }

            await wait(interval);
        }
        await wait(interval);
    }

    public async playScenario(scenario: Scenario, options?: PlayOptions): Promise<boolean> {
        const promise = new Promise<boolean>((resolve, reject) => {
            this.queue.push({
                scenario,
                reject,
                resolve,
                play_options: options,
                props: [],
            });
        });

        // Will stop current animation if in loop
        if (this.currentAnimationLoopResolve) {
            this.currentAnimationLoopResolve();
        }

        return promise;
    }

    public async playAnimation(animation: Animation, options?: PlayOptions): Promise<boolean> {
        if (animation.enter?.dictionary) {
            await this.resourceLoader.loadAnimationDictionary(animation.enter.dictionary);
        }

        if (animation.base.dictionary) {
            await this.resourceLoader.loadAnimationDictionary(animation.base.dictionary);
        }

        if (animation.exit?.dictionary) {
            await this.resourceLoader.loadAnimationDictionary(animation.exit.dictionary);
        }

        const promise = new Promise<boolean>((resolve, reject) => {
            this.queue.push({
                animation,
                reject,
                resolve,
                play_options: options,
                props: [],
            });
        });

        // Will stop current animation if in loop
        if (this.currentAnimationLoopResolve) {
            this.currentAnimationLoopResolve();
        }

        return promise;
    }

    public stop() {
        if (this.currentAnimationLoopResolve) {
            this.currentAnimationLoopResolve();
        }
    }

    public purge() {
        this.queue = [];

        if (this.currentAnimationLoopResolve) {
            this.currentAnimationLoopResolve();
        }
    }

    public destroy() {
        this.stop();
        this.running = false;
    }
}
