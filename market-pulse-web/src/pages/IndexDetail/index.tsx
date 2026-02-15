import { useParams } from 'react-router-dom';

export function IndexDetail() {
  const { id } = useParams<{ id: string }>();
  return <div>IndexDetail — id: {id}</div>;
}
