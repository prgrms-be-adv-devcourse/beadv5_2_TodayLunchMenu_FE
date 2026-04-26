import { Link } from 'react-router-dom';

function AdminNav({ currentPage = 'dashboard' }) {
  const isActive = (page) => currentPage === page;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '#' },
    { id: 'reports', label: 'Reports', to: '/admin/member-reports' },
    { id: 'sanctions', label: 'Sanctions', to: '/admin/member-restrictions' },
    { id: 'categories', label: 'Categories', to: '/admin/categories' },
    { id: 'embeddings', label: 'Embeddings', to: '/admin/embeddings' },
    { id: 'users', label: 'Users', href: '#' },
  ];

  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-violet-100 bg-[#fdf3ff]/80 px-6 py-3 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-black tracking-tight text-violet-700 hover:opacity-80 transition-opacity">
          Vivid Artifact
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => {
            const isCurrentActive = isActive(item.id);
            const className = `font-bold transition-colors ${
              isCurrentActive
                ? 'text-violet-700 relative after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-violet-600'
                : 'text-slate-500 hover:text-violet-500'
            }`;

            if (item.to) {
              return (
                <Link key={item.id} to={item.to} className={className}>
                  {item.label}
                </Link>
              );
            }

            return (
              <span key={item.id} className={className}>
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-violet-200 ring-2 ring-violet-200/60" />
      </div>
    </nav>
  );
}

export default AdminNav;
