// FILE: frontend/navbar.js

function initNavbar(activePage) {
    const currentKey = localStorage.getItem('book_api_key');
    const userName = localStorage.getItem('user_name') || 'Developer';
    
    injectNavbarStyles();

    if (!currentKey && activePage !== 'home') {
        window.location.replace('/');
        return;
    }

    // PAKAI BACKTICK (`) DI AWAL DAN AKHIR
    const navbarHTML = `
        <aside class="sidebar-wrapper">
            <div class="sidebar-header" onclick="window.location.href='/'">
                <div class="logo-glow-icon">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="logo-text">
                    BOOK<span>API</span>
                </div>
            </div>
            
            <div class="sidebar-content">
                <div class="nav-label">MAIN MENU</div>
                <nav class="nav-menu">
                    <div class="menu-item ${activePage === 'developer' ? 'active' : ''}" onclick="window.location.href='developer.html'">
                        <i class="fas fa-key"></i>
                        <span>API Management</span>
                    </div>
                    <div class="menu-item ${activePage === 'playground' ? 'active' : ''}" onclick="window.location.href='playground.html'">
                        <i class="fas fa-vial"></i>
                        <span>API Playground</span>
                    </div>
                    <div class="menu-item ${activePage === 'docs' ? 'active' : ''}" onclick="window.location.href='docs.html'">
                        <i class="fas fa-file-code"></i>
                        <span>Dokumentasi</span>
                    </div>
                </nav>

                <div class="nav-label mt-4">RESOURCES</div>
                <nav class="nav-menu">
                    <div class="menu-item" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Keluar Akun</span>
                    </div>
                </nav>
            </div>

            <div class="sidebar-footer">
                <div class="user-card">
                    <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <div class="user-name">${userName}</div>
                        <div class="user-plan">Developer Tier</div>
                    </div>
                </div>
            </div>
        </aside>
    `;

    const container = document.getElementById('navbar-container');
    if(container) {
        container.innerHTML = navbarHTML;
    }
}

function logout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Yakin ingin keluar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Keluar',
        background: '#0f172a',
        color: '#fff'
    }).then((res) => {
        if (res.isConfirmed) {
            localStorage.clear();
            window.location.replace('/');
        }
    });
}

function injectNavbarStyles() {
    if (document.getElementById('navbar-styles')) return;
    const style = document.createElement('style');
    style.id = 'navbar-styles';
    style.innerHTML = `
        :root {
            --sidebar-w: 280px;
            --cyan: #00d2ff;
            --glass: rgba(15, 23, 42, 0.85);
            --border: rgba(255, 255, 255, 0.1);
        }

        .sidebar-wrapper {
            width: var(--sidebar-w); height: 100vh; position: fixed;
            left: 0; top: 0; background: var(--glass); backdrop-filter: blur(25px);
            border-right: 1px solid var(--border); display: flex; flex-direction: column;
            padding: 35px 20px; z-index: 1000;
        }

        .sidebar-header { display: flex; align-items: center; gap: 15px; cursor: pointer; margin-bottom: 45px; }
        .logo-glow-icon { font-size: 1.8rem; color: var(--cyan); filter: drop-shadow(0 0 10px var(--cyan)); }
        .logo-text { font-weight: 800; font-size: 1.4rem; color: #fff; letter-spacing: -1px; }
        .logo-text span { color: var(--cyan); }
        .nav-label { font-size: 0.75rem; font-weight: 800; color: #475569; letter-spacing: 2px; margin-bottom: 15px; padding-left: 10px; }
        .nav-menu { display: flex; flex-direction: column; gap: 10px; }
        .menu-item { display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 15px; color: #94a3b8; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .menu-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .menu-item.active { background: linear-gradient(90deg, rgba(0, 210, 255, 0.15) 0%, transparent 100%); color: var(--cyan); border-left: 4px solid var(--cyan); }
        .sidebar-footer { margin-top: auto; }
        .user-card { display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 18px; border-radius: 20px; border: 1px solid var(--border); }
        .user-avatar { width: 45px; height: 45px; border-radius: 12px; background: var(--cyan); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.3rem; }
        .user-name { font-weight: 800; font-size: 0.95rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
        .user-plan { font-size: 0.7rem; color: var(--cyan); font-weight: 700; }
    `;
    document.head.appendChild(style);
}