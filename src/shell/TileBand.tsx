import type { Horizon } from '../data/types.ts';
import type { ModuleDeclaration } from '../declarations/types.ts';
import { ElementTile } from './ElementTile.tsx';

export function TileBand({
  declarations,
  horizon,
  onActivate,
}: {
  declarations: readonly ModuleDeclaration[];
  horizon: Horizon;
  onActivate: (id: string) => void;
}): JSX.Element {
  return (
    <div className="tile-band">
      {declarations.map((d) => {
        const tileProps =
          d.status === 'live'
            ? { content: d.content[horizon], horizon, status: d.status, onActivate: () => onActivate(d.id) }
            : { content: d.content[horizon], horizon, status: d.status };
        return <ElementTile key={d.id} {...tileProps} />;
      })}
    </div>
  );
}
