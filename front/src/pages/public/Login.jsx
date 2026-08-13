import "../../css/Login.css";
import { useState } from "react";
import { useNavigate } from 'react-router-dom'
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); 
  const [msg, setMsg] = useState(""); 
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {
    setError('');
      setMsg('');
      if (loading) return; // Empêche plusieurs clics

      setLoading(true);
       e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
    



      if (!res.ok) {
       setError(data.message || "Une erreur est survenue.");
        return;
      }

      if (data.error) {
        setError("Impossible de contacter le serveur.");
        return;
      }

      const status = String(data.statut || data.status || '').toLowerCase();
      const suspended = status === 'suspendu' || status === 'suspended' || data.suspended === true;

      if (suspended) {
        localStorage.removeItem("token");
        localStorage.removeItem("nom");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        localStorage.removeItem('avatar');
        setError("Ce compte est suspendu. Vous ne pouvez pas vous connecter.");
        setMsg('');
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("nom", data.nom);
        localStorage.setItem("prenom", data.prenom);
        localStorage.setItem("email", data.email);
        localStorage.setItem("role", data.role);
        localStorage.setItem('avatar', data.avatar);

        const role = String(data.role || '').toLowerCase();
        if (role.includes('admin')) {
          navigate('/admin/boutiques');
        } else {
          navigate('/espConnecter');
        }
        return;
      }

      setError(data.message || "Identifiants incorrects.");
      setMsg('');
      
    } catch (error) {
      console.error('An error occurred during login.', error);
    }  finally {
    setLoading(false);
  }
  }
  const handleForgotPassword = () => {
    console.log({
      email,
    });
  }

  return (
  
<>
 

  <main className="auth-wrap">
    <div className="auth-card">
      <h2 style={{ color: '#000' }}> Se connecter</h2>
      {error && (
                 <div className="auth-error">
                 {error}
                 </div>
                )}
      <div className="auth-msg">
       {msg}
     </div>

   
      <form onSubmit={handleLogin}>
  <div className="auth-pane active" id="pane-login">
    <div className="field">
      <label htmlFor="login-email">Adresse e-mail</label>
      <input
        type="email"
        id="login-email"
        placeholder="vous@exemple.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>

    <div className="field">
      <label htmlFor="login-password">Mot de passe</label>
      <input
        type="password"
        id="login-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </div>

    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
      <a className="auth-forgot" data-goto-pane="forgot" href="#">
        Mot de passe oublié ?
      </a>
    </div>

    <button
      type="submit"
      className="btn teal"
      id="loginSubmitBtn"
    >
     {loading ? "connexion en cours..." : "se connecter"}
    </button>

    <div className="auth-sep">— ou —</div>

    <button
      type="button"
      className="btn outline"
      style={{ width: "100%" }}
    >
      Continuer avec Google
    </button>
  </div>
</form>

     
      <div className="auth-pane" id="pane-forgot">
        <h3 style={{ marginBottom: '8px' }}>Réinitialiser le mot de passe</h3>
        <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: '0 0 16px' }}>Entrez votre e-mail, un lien de réinitialisation vous sera envoyé.</p>
        <div className="field">
          <label htmlFor="forgot-email">Adresse e-mail</label>
          <input type="email" id="forgot-email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
        </div>
        <button className="btn teal" id="forgotSubmitBtn" onClick={handleForgotPassword}>Envoyer le lien</button>
        <a className="auth-back" data-goto-pane="login" href="#">← Retour à la connexion</a>
      </div>
    </div>
  </main>

  




</>
  );
}

export default Login;
