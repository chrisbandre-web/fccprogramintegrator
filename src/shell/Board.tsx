import { bands } from './bands.ts';
import { moduleRegistry } from '../declarations/registry.ts';
import { BandLabel } from './BandLabel.tsx';
import { TileBand } from './TileBand.tsx';
import { RegisterField } from './RegisterField.tsx';
import { useContextHorizon } from './SessionStateProvider.tsx';

export function Board({ onActivateModule }: { onActivateModule: (id: string) => void }): JSX.Element {
  const [horizon] = useContextHorizon('board');

  return (
    <div style={{ width: 'var(--field-width)' }}>
      {bands.map((band) => {
        const declarationsInBand = moduleRegistry.filter((d) => d.placement.band === band.id);
        return (
          <div className="band" key={band.id}>
            <BandLabel label={band.label} />
            {band.presentation === 'tile' ? (
              <TileBand declarations={declarationsInBand} horizon={horizon} onActivate={onActivateModule} />
            ) : (
              <RegisterField declarations={declarationsInBand} horizon={horizon} />
            )}
          </div>
        );
      })}
    </div>
  );
}
