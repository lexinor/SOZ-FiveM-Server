import { Module } from '../../core/decorators/module';
import { PlayerAnimationProvider } from './player.animation.provider';
import { PlayerDiseaseProvider } from './player.disease.provider';
import { PlayerHealthProvider } from './player.health.provider';
import { PlayerIdentityProvider } from './player.identity.provider';
import { PlayerInjuryProvider } from './player.injury.provider';
import { PlayerInOutProvider } from './player.inout.provider';
import { PlayerMenuProvider } from './player.menu.provider';
import { PlayerPositionProvider } from './player.position.provider';
import { PlayerQbcoreProvider } from './player.qbcore.provider';
import { PlayerStressProvider } from './player.stress.provider';
import { PlayerWalkstyleProvider } from './player.walkstyle.provider';
import { PlayerWardrobe } from './player.wardrobe';
import { ProgressProvider } from './progress.provider';

@Module({
    providers: [
        PlayerAnimationProvider,
        PlayerQbcoreProvider,
        ProgressProvider,
        PlayerHealthProvider,
        PlayerDiseaseProvider,
        PlayerStressProvider,
        PlayerWardrobe,
        PlayerWalkstyleProvider,
        PlayerInjuryProvider,
        PlayerInOutProvider,
        PlayerPositionProvider,
        PlayerIdentityProvider,
        PlayerMenuProvider,
    ],
})
export class PlayerModule {}
