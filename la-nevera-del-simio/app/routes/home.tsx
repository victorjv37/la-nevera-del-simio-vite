import { redirect } from 'react-router';

export function loader() {
  return redirect('/fridge');
}

export default function Home() {
  return null;
}
