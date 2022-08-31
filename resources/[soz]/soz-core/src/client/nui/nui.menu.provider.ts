import { Command } from '../../core/decorators/command';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { NuiDispatch } from './nui.dispatch';

@Provider()
export class NuiMenuProvider {
    @Inject(NuiDispatch)
    private nuiDispatch: NuiDispatch;

    @Command('soz_menu_up', {
        description: 'Haut dans un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'UP',
            },
        ],
    })
    onMenuUp(): void {
        this.nuiDispatch.dispatch('menu', 'ArrowUp');
    }

    @Command('soz_menu_down', {
        description: 'Bas dans un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'DOWN',
            },
        ],
    })
    onMenuDown(): void {
        this.nuiDispatch.dispatch('menu', 'ArrowDown');
    }

    @Command('soz_menu_left', {
        description: 'Gauche dans un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'LEFT',
            },
        ],
    })
    onMenuLeft(): void {
        this.nuiDispatch.dispatch('menu', 'ArrowLeft');
    }

    @Command('soz_menu_right', {
        description: 'Droite dans un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'RIGHT',
            },
        ],
    })
    onMenuRight(): void {
        this.nuiDispatch.dispatch('menu', 'ArrowRight');
    }

    @Command('soz_menu_enter', {
        description: 'Confirmer dans un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'RETURN',
            },
        ],
    })
    onMenuEnter(): void {
        this.nuiDispatch.dispatch('menu', 'Enter');
    }

    @Command('soz_menu_back', {
        description: 'Revenir en arrière dans un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'BACK',
            },
        ],
    })
    onMenuBackspace(): void {
        this.nuiDispatch.dispatch('menu', 'Backspace');
    }

    @Command('soz_menu_close', {
        description: 'Fermer un menu',
        keys: [
            {
                mapper: 'keyboard',
                key: 'PLUS',
            },
        ],
    })
    onMenuClose(): void {
        this.nuiDispatch.dispatch('menu', 'CloseMenu');
    }
}