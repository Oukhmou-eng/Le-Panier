import{ useState } from 'react';
import "../../css/Registre.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";




function Registre() {
    const [loading, setLoading] = useState(false);
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);  
    const [error, setError] = useState(""); 
    const [msg, setMsg] = useState(""); 
      const navigate = useNavigate();
    
const log = ()=>{

    navigate('/login');
  }

    const handleRegister = async () => {

      setError('');
      setMsg('');
      if (loading) return; // Empêche plusieurs clics

      setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, prenom, email, password , confirmPassword})
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
        setMsg(data.message) ; 
      console.log('Registration successful:', data); navigate('/login');
    } catch (error) {
      console.error('An error occurred during registration.', error);
    } finally {
    setLoading(false);
  }

  }
 
  
   
   
    return (
     <>

  

  <main className="auth-wrap">
    <div className="auth-card">
      <h2 style={{ fontSize: '19px', marginBottom: '20px' }}>Créer un compte</h2>
      {error && (
                 <div className="auth-error">
                 {error}
                 </div>
                )}
    <div className="auth-msg">
       {msg}
     </div>

      <div className="auth-pane active" id="pane-register">
        <div className="field">
          <label htmlFor="register-name">Nom</label>
          <input id="register-name" placeholder="Votre nom" value={nom} onChange={(e) => setNom(e.target.value)}/>
        </div>
        <div className="field">  
          <label htmlFor="register-prenom">Prenom</label>
          <input id="register-prenom" placeholder="Votre prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)}/>
        </div>
        <div className="field">
          <label htmlFor="register-email">Adresse e-mail</label>
          <input type="email" id="register-email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
        </div>
        <div className="field">
          <label htmlFor="register-password">Mot de passe</label>
          <input type="password" id="register-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
          <div className="field-hint">8 caractères minimum</div>
        </div>
        <div className="field">
          <label htmlFor="register-password-confirm">Confirmer le mot de passe</label>
          <input type="password" id="register-password-confirm" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
        </div>
        <div className="field-check">
          <input type="checkbox" id="register-terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}/>
          <label htmlFor="register-terms">J'accepte les <a href="#">conditions d'utilisation</a> et la <a href="#">politique de confidentialité</a></label>
        </div>
        <button className="btn teal" id="registerSubmitBtn" onClick={handleRegister}> {loading ? "Création..." : "Créer mon compte"}</button>
        <div className="auth-sep">— ou —</div>
        <button className="btn outline" style={{ width: '100%' }}>Continuer avec Google</button>
        
        <Link  className="auth-back" to="/login">Déjà un compte ? Se connecter </Link>
      </div>
    </div>
  </main>

  
  </>
);
}


export default Registre;