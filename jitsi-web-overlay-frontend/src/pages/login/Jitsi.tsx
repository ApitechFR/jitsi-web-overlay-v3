import React from 'react';
import { useSearchParams } from 'react-router-dom';

function Jitsi() {
  const [searchParams, setSearchParams] = useSearchParams();

  return <div>jitsi {searchParams}</div>;
}

export default Jitsi;
