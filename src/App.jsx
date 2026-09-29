import { createContext, useContext, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

/* ---------- Auth (client-side, mocked) ---------- */
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const signIn = (email) => {
    const u = { email };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };
  const signOut = () => {
    localStorage.removeItem("user");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return <Navigate to="/signin" replace state={{ from: location }} />;
  return children;
}

/* ---------- Sign-in route ---------- */
function SignIn() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/products" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    signIn(form.email);
    navigate(location.state?.from?.pathname || "/products", { replace: true });
  };

  const onChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <main className="auth">
      <h1>Stockroom</h1>
      <p className="muted">Sign in to manage your products.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label>Email
          <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
        </label>
        <label>Password
          <input name="password" type="password" value={form.password} onChange={onChange} autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" type="submit">Sign in</button>
      </form>
    </main>
  );
}

/* ---------- Products route (protected) ---------- */
const SEED = [
  { id: 1, name: "Laptop Stand", price: 2500, stock: 14, category: "Accessories" },
  { id: 2, name: "Mechanical Keyboard", price: 6800, stock: 6, category: "Peripherals" },
  { id: 3, name: "USB-C Hub", price: 3200, stock: 0, category: "Accessories" },
];
const EMPTY = { name: "", price: "", stock: "", category: "" };

function Products() {
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("products")) ?? SEED; } catch { return SEED; }
  });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const onChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const reset = () => { setForm(EMPTY); setEditingId(null); setError(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return setError("Name and category are required.");
    if (form.price === "" || Number(form.price) < 0) return setError("Enter a valid price.");
    if (form.stock === "" || Number(form.stock) < 0) return setError("Enter a valid stock count.");

    const item = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };
    if (editingId) {
      setProducts(products.map((p) => (p.id === editingId ? { ...p, ...item } : p)));
    } else {
      setProducts([...products, { id: Date.now(), ...item }]);
    }
    reset();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, price: p.price, stock: p.stock, category: p.category });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    setProducts(products.filter((x) => x.id !== p.id));
    if (editingId === p.id) reset();
  };

  return (
    <div className="shell">
      <header className="bar">
        <h1>Stockroom</h1>
        <div className="who">
          <span className="muted">{user.email}</span>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className="panel">
        <h2>{editingId ? "Edit product" : "Add product"}</h2>
        <form className="grid" onSubmit={handleSubmit} noValidate>
          <label>Name
            <input name="name" value={form.name} onChange={onChange} />
          </label>
          <label>Category
            <input name="category" value={form.category} onChange={onChange} />
          </label>
          <label>Price (KES)
            <input name="price" type="number" min="0" value={form.price} onChange={onChange} />
          </label>
          <label>Stock
            <input name="stock" type="number" min="0" value={form.stock} onChange={onChange} />
          </label>
          {error && <p className="error full" role="alert">{error}</p>}
          <div className="actions full">
            <button className="btn primary" type="submit">{editingId ? "Save changes" : "Add product"}</button>
            {editingId && <button className="btn" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Products <span className="muted">({products.length})</span></h2>
        {products.length === 0 ? (
          <p className="muted">No products yet. Add your first one above.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th></th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={p.id === editingId ? "editing" : ""}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td className="num">KES {p.price.toLocaleString()}</td>
                    <td className="num">{p.stock === 0 ? <span className="out">Out of stock</span> : p.stock}</td>
                    <td className="row-actions">
                      <button className="btn sm" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn sm danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </AuthProvider>
  );
}