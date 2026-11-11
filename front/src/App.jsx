import { BrowserRouter,Routes, Route, Navigate } from 'react-router-dom';
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Navbar from './layouts/PublicLayout'
import './App.css'

import Login from './pages/public/Login'
import Registre from './pages/public/Registre'
import Home from './pages/public/Home'
import Boutiques from './pages/public/Boutiques'
import Boutique from './pages/public/Boutique'
import SignaleCard from './components/signaleCard'
import Catalogue from    './pages/public/Catalogue'
import Soldes from    './pages/public/Soldes'
import Produit from './pages/public/Produit'
import Panier from './pages/public/Panier'
import Comptelayout from './layouts/Comptelayout'
import VendeurSidebar from './layouts/VendeurLayout'
import AdminSidebar from './layouts/Adminlayout'

import Messages from './pages/compte/Messages'
import MessagesVendeur from './pages/vendeur/MessagesVendeur'
import CammandesRecues from './pages/vendeur/CammandesRecues'
import Favoris from './pages/compte/Favoris'
import BoutiquesS from './pages/compte/BoutiquesSuivies'
import Notifications from './pages/compte/Notifications'
import MesProduits from './pages/vendeur/MesProduits'
import Publicites from './pages/vendeur/Publicites'
import CreerBoutique from './pages/compte/CreerBoutique'
import PublierProduit from './pages/vendeur/PublierProduit'
import AvisClients from './pages/vendeur/AvisClients'
import Commandes from './pages/compte/Commandes'
import Parametres from './pages/compte/Parametres'
import ParametresVendeur from './pages/vendeur/ParametresVendeur'
import Statistiques from './pages/vendeur/Statistiques'
import Dashboard from './pages/vendeur/Dashboard'
import AdminBoutiques from './pages/admin/Boutiques'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminPlanTarifs from './pages/admin/PlanTarifs'
import AdminSignalements from './pages/admin/Signalements'
import AdminCategories from './pages/admin/Categories'
import FacturesBoutiques from './pages/admin/FacturesBoutiques'


function App() {
  const token = localStorage.getItem('token');

   
  return (


  
      <Routes>
        <Route path="/"    element={<><Navbar/><Home /></> } />
        <Route path="/login"    element={<><Navbar/><Login /></> } />
        <Route path="/registre" element={<><Navbar/><Registre /></> } />
        <Route path="/home"    element={<><Navbar/><Home /></> } />
        <Route path="/panier"    element={<><Navbar/><Panier /></> } />
         
         <Route path="/vendeur"    element={<><Navbar/><VendeurSidebar/></> } />
        <Route path="/dashboard-vendeur" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><Dashboard/></div></>} />
        <Route path="/boutiques"    element={<><Navbar/><Boutiques /></> } />
        <Route path="/boutique/:id"    element={<><Navbar/><Boutique /></> } />


        <Route path="/signaler"    element={<><Navbar/><SignaleCard /></> } />



        <Route path="/catalogue"    element={<><Navbar/><Catalogue /></> } />
        <Route path="/soldes"    element={<><Navbar/><Soldes/></> } />
        <Route path="/produit/:id"    element={<><Navbar/><Produit /></> } />
        

       
        <Route path="/mes-produits" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><MesProduits/></div></>} />
        <Route path="/publicites" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><Publicites/></div></>} />
        <Route path="/publierProduit" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><PublierProduit/></div></>} />
        <Route path="/publierProduit/:id" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><PublierProduit/></div></>} />
        <Route path="/avis-clients" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><AvisClients/></div></>} />
        <Route path="/messages" element={<><Navbar/><Messages/></>} />
        <Route path="/messages-vendeur" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><MessagesVendeur/></div></>} />
        <Route path="/commandes-recues" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><CammandesRecues/></div></>} />
        <Route path="/statistiques" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><Statistiques/></div></>} />
        <Route path="/parametres-vendeur" element={<><Navbar/><div className="app-connected active"><VendeurSidebar/><ParametresVendeur/></div></>} />
        <Route path="/admin/dashboard" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><AdminDashboard/></div></> : <Navigate to="/login" />
        } />
        <Route path="/admin/boutiques" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><AdminBoutiques/></div></> : <Navigate to="/login" />
        } />
        <Route path="/admin/users" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><AdminUsers/></div></> : <Navigate to="/login" />
        } />
        <Route path="/admin/plans" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><AdminPlanTarifs/></div></> : <Navigate to="/login" />
        } />
        <Route path="/admin/categories" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><AdminCategories/></div></> : <Navigate to="/login" />
        } />
        <Route path="/admin/factures" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><FacturesBoutiques/></div></> : <Navigate to="/login" />
        } />
        <Route path="/admin/signalements" element={
          token ? <><Navbar/><div className="app-connected active"><AdminSidebar/><AdminSignalements/></div></> : <Navigate to="/login" />
        } />

       <Route path="/espConnecter" element={
          token ? <><Navbar/><Home /></> : <Navigate to="/login" />
        } />
        <Route path="/parametres" element={
          token ? <><Navbar/><Parametres/></> : <Navigate to="/login" />
        } />
        <Route path="/favoris" element={
          token ? <><Navbar/><Favoris/> </> : <Navigate to="/login" />
        } />
        <Route path="/mes-commandes" element={
          token ? <><Navbar/><Commandes /> </> : <Navigate to="/login" />
        } />
       <Route path="/notifications" element={
          token ? <><Navbar/><Notifications/> </> : <Navigate to="/login" />
        } />
        <Route path="/boutiques-suivies" element={
          token ? <><Navbar/><BoutiquesS/> </> : <Navigate to="/login" />
        } />
        <Route path="/creer-boutique" element={
          token ? <><Navbar/><CreerBoutique /> </> : <Navigate to="/login" />
        } />





      </Routes>
   
  )
}

export default App
