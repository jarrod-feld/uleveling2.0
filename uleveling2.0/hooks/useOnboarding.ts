import { useState } from 'react';

export default function useOnboarding() {
  // Hook logic here
  const [data, setData] = useState(null);
  return { data, setData };
} 