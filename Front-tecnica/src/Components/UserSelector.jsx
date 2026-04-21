import React, { useState, useEffect } from 'react';

export default function UserSelector({ onSelect }) {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('http://localhost:3001/api/auth/available-users').then(r => r.json()).then(setUsers);
  }, []);

  return (
    <select onChange={(e) => onSelect(users.find(u => u.user_id === e.target.value))}>
      <option value="">Cambiar Perfil...</option>
      {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>)}
    </select>
  );
}
