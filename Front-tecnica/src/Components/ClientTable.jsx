export default function ClientTable({ clients }) {
  return (
    <table>
      <thead>
        <tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Score</th></tr>
      </thead>
      <tbody>
        {clients.map(c => (
          <tr key={c.client_id}>
            <td><strong>{c.full_name}</strong></td>
            <td className={c.email.includes('*') ? 'masked' : ''}>{c.email}</td>
            <td className={c.phone.includes('*') ? 'masked' : ''}>{c.phone}</td>
            <td>{c.sensitive_score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
