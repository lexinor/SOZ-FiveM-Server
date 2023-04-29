import { Command } from '../../core/decorators/command';
import { OnNuiEvent } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { ClothConfig } from '../../shared/cloth';
import { NuiEvent, ServerEvent } from '../../shared/event';
import { MenuType } from '../../shared/nui/menu';
import { Vector3 } from '../../shared/polyzone/vector';
import { AnimationService } from '../animation/animation.service';
import { HudProvider } from '../hud/hud.provider';
import { JobMenuProvider } from '../job/job.menu.provider';
import { Notifier } from '../notifier';
import { NuiDispatch } from '../nui/nui.dispatch';
import { NuiMenu } from '../nui/nui.menu';
import { PlayerAnimationProvider } from './player.animation.provider';
import { PlayerService } from './player.service';
import { PlayerWardrobe } from './player.wardrobe';

@Provider()
export class PlayerMenuProvider {
    @Inject(NuiDispatch)
    private dispatcher: NuiDispatch;

    @Inject(NuiMenu)
    private menu: NuiMenu;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(AnimationService)
    private animationService: AnimationService;

    @Inject(PlayerWardrobe)
    private playerWardrobe: PlayerWardrobe;

    @Inject(HudProvider)
    private hudProvider: HudProvider;

    @Inject(PlayerAnimationProvider)
    private playerAnimationProvider: PlayerAnimationProvider;

    @Inject(JobMenuProvider)
    private jobMenuProvider: JobMenuProvider;

    @Inject(NuiDispatch)
    private nuiDispatch: NuiDispatch;

    @Command('soz_core_toggle_personal_menu', {
        description: 'Ouvrir le menu personnel',
        keys: [
            {
                mapper: 'keyboard',
                key: 'F1',
            },
        ],
    })
    public async togglePersonalMenu() {
        if (this.menu.getOpened() === MenuType.PlayerPersonal) {
            this.menu.closeMenu();
            return;
        }

        this.menu.openMenu(MenuType.PlayerPersonal, {
            isCinematicCameraActive: this.hudProvider.isCinematicCameraActive,
            isCinematicMode: this.hudProvider.isCinematicMode,
            isHudVisible: this.hudProvider.isHudVisible,
            shortcuts: this.playerAnimationProvider.getShortcuts(),
            job: this.jobMenuProvider.getJobMenuData(),
        });
    }

    @OnNuiEvent(NuiEvent.PlayerMenuOpenKeys)
    public async openKeys() {
        TriggerServerEvent(ServerEvent.VEHICLE_OPEN_KEYS);

        this.menu.closeMenu();
    }

    @OnNuiEvent(NuiEvent.PlayerMenuCardShow)
    public async showCard({ type }) {
        const position = GetEntityCoords(PlayerPedId()) as Vector3;
        const players = this.playerService.getPlayersAround(position, 3.0);

        if (players.length <= 1) {
            this.notifier.notify("Il n'y a personne à proximité", 'error');
            return;
        }

        await this.animationService.playAnimation({
            base: {
                dictionary: 'mp_common',
                name: 'givetake2_a',
                blendInSpeed: 8.0,
                blendOutSpeed: 8.0,
            },
        });

        TriggerServerEvent(ServerEvent.PLAYER_SHOW_IDENTITY, type, players);
    }

    @OnNuiEvent(NuiEvent.PlayerMenuCardSee)
    public async seeCard({ type }) {
        const player = this.playerService.getPlayer();

        if (!player) {
            return;
        }

        this.dispatcher.dispatch('card', 'addCard', {
            type,
            player,
        });
    }

    @OnNuiEvent(NuiEvent.PlayerMenuClothConfigUpdate)
    public async clothComponentUpdate({ key, value }: { key: keyof ClothConfig['Config']; value: boolean }) {
        const player = this.playerService.getPlayer();

        if (!player) {
            return;
        }

        await this.playerWardrobe.setClothConfig(key, value);
    }

    @OnNuiEvent(NuiEvent.PlayerMenuAnimationStop)
    public async stopAnimation() {
        this.animationService.purge();
    }

    @OnNuiEvent(NuiEvent.PlayerMenuHudSetGlobal)
    public async hudComponentSetGlobal({ value }: { value: boolean }) {
        this.hudProvider.isHudVisible = value;
        TriggerEvent(
            'hud:client:OverrideVisibility',
            this.hudProvider.isHudVisible && !this.hudProvider.isCinematicMode
        );
    }

    @OnNuiEvent(NuiEvent.PlayerMenuHudSetCinematicMode)
    public async hudComponentSetCinematicMode({ value }: { value: boolean }) {
        this.hudProvider.isCinematicMode = value;
        TriggerEvent(
            'hud:client:OverrideVisibility',
            this.hudProvider.isHudVisible && !this.hudProvider.isCinematicMode
        );
    }

    @OnNuiEvent(NuiEvent.PlayerMenuHudSetCinematicCameraActive)
    public async hudComponentSetCinematicCameraActive({ value }: { value: boolean }) {
        this.hudProvider.isCinematicCameraActive = value;
    }

    @OnNuiEvent(NuiEvent.PlayerMenuVoipReset)
    public async resetVoip() {
        TriggerEvent('voip:client:reset');
    }
}
