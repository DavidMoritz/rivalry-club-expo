import { RivalryIndex } from './RivalryIndex';

interface Game {
  id: string;
  name: string;
}

interface AccessProps {
  selectedGame: Game | null;
}

export function Access({ selectedGame: _selectedGame }: AccessProps) {
  return <RivalryIndex />;
}
