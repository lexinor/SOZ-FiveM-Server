import { OnEvent } from '../../../core/decorators/event';
import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { ServerEvent } from '../../../shared/event';
import { InventoryItem } from '../../../shared/item';
import { FoodCraftProcess } from '../../../shared/job/food';
import { InventoryManager } from '../../item/inventory.manager';
import { ItemService } from '../../item/item.service';
import { Notifier } from '../../notifier';
import { PlayerService } from '../../player/player.service';
import { ProgressService } from '../../player/progress.service';

@Provider()
export class FoodCraftProvider {
    @Inject(ItemService)
    private itemService: ItemService;

    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(ProgressService)
    private progressService: ProgressService;

    @Inject(Notifier)
    private notifier: Notifier;

    @OnEvent(ServerEvent.FOOD_CRAFT)
    public async onCraft(source: number, craftProcess: FoodCraftProcess, duration: number) {
        if (!this.canCraft(source, craftProcess)) {
            this.notifier.notify(source, `Vous n'avez pas les ingrédients nécessaires pour cuisiner.`, 'error');
            return;
        }

        this.notifier.notify(source, 'Vous ~g~commencez~s~ à cuisiner.', 'success');

        while (this.canCraft(source, craftProcess)) {
            const hasCrafted = await this.doCraft(source, craftProcess, duration);
            const outputItemLabel = this.itemService.getItem(craftProcess.output.id).label;
            if (hasCrafted) {
                this.notifier.notify(source, `Vous avez cuisiné un·e ~g~${outputItemLabel}~s~.`);
            } else {
                this.notifier.notify(source, 'Vous avez ~r~arrêté~s~ de cuisiner.');
                return;
            }
        }
    }

    private canCraft(source: number, craftProcess: FoodCraftProcess): boolean {
        for (const input of craftProcess.inputs) {
            const predicate = (item: InventoryItem) => {
                return item.name === input.id && item.amount >= input.amount && !this.itemService.isItemExpired(item);
            };
            if (!this.inventoryManager.findItem(source, predicate)) {
                return false;
            }
        }
        return true;
    }

    private async doCraft(source: number, craftProcess: FoodCraftProcess, duration: number): Promise<boolean> {
        const { completed } = await this.progressService.progress(
            source,
            'food_craft',
            'Vous cuisinez...',
            duration,
            {
                dictionary: 'amb@prop_human_bbq@male@idle_a',
                name: 'idle_b',
                flags: 1,
            },
            {
                disableCombat: true,
                disableCarMovement: true,
                disableMovement: true,
            }
        );

        if (!completed) {
            return false;
        }

        for (const input of craftProcess.inputs) {
            this.inventoryManager.removeItemFromInventory(source, input.id, input.amount);
        }
        this.inventoryManager.addItemToInventory(source, craftProcess.output.id, craftProcess.output.amount);
        return true;
    }
}