import { Exportable } from '../../../core/decorators/exports';
import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { Rpc } from '../../../core/decorators/rpc';
import { Tick, TickInterval } from '../../../core/decorators/tick';
import { uuidv4 } from '../../../core/utils';
import { BennysConfig, BennysOrder } from '../../../shared/job/bennys';
import { isErr } from '../../../shared/result';
import { RpcServerEvent } from '../../../shared/rpc';
import { getDefaultVehicleCondition } from '../../../shared/vehicle/vehicle';
import { BankService } from '../../bank/bank.service';
import { PrismaService } from '../../database/prisma.service';
import { Notifier } from '../../notifier';
import { PlayerService } from '../../player/player.service';

@Provider()
export class BennysOrderProvider {
    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(BankService)
    private bankService: BankService;

    private ordersInProgress: Map<string, BennysOrder> = new Map();

    private orderedVehicle = 0;

    // Tick every minute to check the orders to complete.
    @Tick(TickInterval.EVERY_MINUTE, 'bennys:orders:check')
    public async onTick() {
        for (const [uuid, bennyOrder] of this.ordersInProgress.entries()) {
            if (new Date(bennyOrder.orderDate).getTime() + 1000 * 60 * BennysConfig.Order.waitingTime < Date.now()) {
                await this.addVehicle(bennyOrder.model);
                this.ordersInProgress.delete(uuid);
            }
        }
    }

    @Rpc(RpcServerEvent.BENNYS_GET_ORDERS)
    public getOrders(): BennysOrder[] {
        return Array.from(this.ordersInProgress.values());
    }

    @Rpc(RpcServerEvent.BENNYS_CANCEL_ORDER)
    public async onCancelOrder(source: number, uuid: string) {
        const order = this.ordersInProgress.get(uuid);
        if (!order) {
            this.notifier.notify(source, `Cette commande n'existe pas.`);
            return;
        }
        this.ordersInProgress.delete(uuid);
        this.notifier.notify(source, `Commande annulée.`);
    }

    @Rpc(RpcServerEvent.BENNYS_ORDER_VEHICLE)
    public async onOrderVehicle(source: number, model: string) {
        const vehicle = await this.prismaService.vehicle.findFirst({
            where: {
                model,
                NOT: {
                    dealershipId: null,
                    price: 0,
                },
            },
        });
        if (!vehicle || vehicle.price === 0) {
            this.notifier.notify(source, `Ce modèle de véhicule n'est pas disponible.`);
            return;
        }
        const vehiclePrice = Math.ceil(vehicle.price * 0.01);
        const transferred = await this.bankService.transferBankMoney('bennys', 'farm_bennys', vehiclePrice);

        if (isErr(transferred)) {
            this.notifier.notify(
                source,
                `Il faut ~r~${vehiclePrice.toLocaleString()}$~s~ sur le compte de l'entreprise.`
            );
            return;
        } else {
            this.notifier.notify(source, `Virement de ~g~${vehiclePrice.toLocaleString()}$~s~ effectué.`);
        }

        const uuid = uuidv4();
        this.ordersInProgress.set(uuid, {
            uuid,
            model,
            orderDate: new Date().toISOString(),
        });

        this.notifier.notify(source, `Votre ${vehicle.model} arrive dans une heure.`);
    }

    @Exportable('deleteTestVehicles')
    async deleteTestVehicles() {
        await this.prismaService.playerVehicle.deleteMany({
            where: {
                plate: {
                    contains: 'ESSAI',
                },
            },
        });
    }

    private async addVehicle(model: string) {
        const vehicle = await this.prismaService.vehicle.findFirst({
            where: {
                model,
            },
        });
        let category = 'car';
        if (vehicle.requiredLicence === 'heli') {
            category = 'air';
        } else if (vehicle.requiredLicence === 'boat') {
            category = 'boat';
        }
        await this.prismaService.playerVehicle.create({
            data: {
                vehicle: model,
                hash: GetHashKey(model).toString(),
                mods: JSON.stringify(BennysConfig.UpgradeConfiguration),
                condition: JSON.stringify(getDefaultVehicleCondition()),
                plate: 'ESSAI ' + (this.orderedVehicle + 1),
                garage: 'bennys_luxury',
                job: 'bennys',
                category: category,
                fuel: 100,
                engine: 1000,
                body: 1000,
                state: 3,
                life_counter: 3,
            },
        });
        this.orderedVehicle++;
    }
}
