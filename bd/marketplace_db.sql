-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 29, 2026 at 04:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30
CREATE DATABASE IF NOT EXISTS marketplace_db;
USE marketplace_db;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `marketplace_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `adresses`
--

CREATE TABLE `adresses` (
  `id_adresse` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `libelle` varchar(100) DEFAULT NULL,
  `ligne1` varchar(255) NOT NULL,
  `ville` varchar(100) NOT NULL,
  `code_postal` varchar(20) NOT NULL,
  `tele` varchar(20) DEFAULT NULL,
  `est_defaut` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adresses`
--

INSERT INTO `adresses` (`id_adresse`, `id_user`, `libelle`, `ligne1`, `ville`, `code_postal`, `tele`, `est_defaut`) VALUES
(1, 1, 'Maison', 'Quartier Atlas', 'Beni Mellal', '23000', '0611111111', 1),
(2, 2, 'Magasin', 'Bd Hassan II', 'Casablanca', '20000', '0622222222', 1),
(3, 3, 'Bureau', 'Centre Ville', 'Rabat', '10000', '0633333333', 1),
(4, 8, NULL, 'charaf', 'bm', '25000', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `avis`
--

CREATE TABLE `avis` (
  `id_avis` int(10) UNSIGNED NOT NULL,
  `id_cible` int(11) NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `type_cible` enum('produit','boutique') NOT NULL DEFAULT 'produit',
  `note` tinyint(3) UNSIGNED NOT NULL CHECK (`note` between 1 and 5),
  `commentaire` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `avis`
--

INSERT INTO `avis` (`id_avis`, `id_cible`, `id_user`, `type_cible`, `note`, `commentaire`, `date_creation`) VALUES
(1, 1, 2, 'boutique', 5, 'Très bonne boutique, livraison rapide et produits conformes.', '2026-07-16 21:06:43'),
(2, 1, 1, 'boutique', 3, 'hello nubvubvvijii', '2026-07-16 21:59:51'),
(3, 1, 1, 'boutique', 1, 'bon servuces ', '2026-07-16 22:01:27'),
(4, 1, 1, 'produit', 3, 'dddd', '2026-07-17 14:42:56'),
(5, 3, 1, 'boutique', 5, 'yes this boutiques is a better \n', '2026-07-21 10:45:19'),
(6, 4, 1, 'produit', 4, 'marouane teste', '2026-07-21 22:23:25'),
(7, 4, 1, 'produit', 4, 'jwfufyfv', '2026-07-21 22:23:47'),
(8, 4, 1, 'produit', 5, 'ih8g7g', '2026-07-21 22:23:55'),
(9, 4, 1, 'produit', 3, 'iug', '2026-07-21 22:25:18'),
(10, 4, 1, 'produit', 3, 'hjyypypyyyyyyyyyyyyyyyyyyyyy', '2026-07-21 22:25:54'),
(11, 1, 8, 'boutique', 3, 'jkfrbgubrugbugugbgbbbbbbbbbbbbbb', '2026-07-21 22:36:46'),
(12, 3, 8, 'boutique', 3, 'ifnbfubf', '2026-07-22 11:00:05'),
(13, 4, 8, 'produit', 3, 'sala;', '2026-07-22 11:04:49'),
(14, 7, 9, 'boutique', 5, 'knvinivvuvbvubry', '2026-07-25 15:02:43'),
(15, 7, 9, 'boutique', 3, 'icbucbuc', '2026-07-25 15:02:47');

-- --------------------------------------------------------

--
-- Table structure for table `boutiques`
--

CREATE TABLE `boutiques` (
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `slug` varchar(170) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `banniere_url` varchar(255) DEFAULT NULL,
  `statut` enum('actif','suspendu') NOT NULL DEFAULT 'actif',
  `note_moyenne` decimal(3,2) NOT NULL DEFAULT 0.00,
  `nbr_abonnes` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `estVerifier` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `boutiques`
--

INSERT INTO `boutiques` (`id_boutique`, `id_user`, `nom`, `slug`, `description`, `logo_url`, `banniere_url`, `statut`, `note_moyenne`, `nbr_abonnes`, `date_creation`, `estVerifier`) VALUES
(1, 2, 'Tech Store', 'tech-store', 'Produits informatiques', NULL, NULL, 'actif', 3.00, 0, '2026-07-13 21:50:20', 0),
(2, 2, 'Mobile Shop', 'mobile-shop', 'Téléphones et accessoires', NULL, NULL, 'actif', 4.00, 0, '2026-07-13 21:50:20', 0),
(3, 1, 'ali bbafgh', 'ali-bbafgh', 'jjjjjjjj hhhhhhhhhhhhhh llllllllll', 'http://localhost:3000/uploads/boutiques/logo-c3080316-2552-4304-b820-65dbae205b6e.png', 'http://localhost:3000/uploads/boutiques/banniere-f55b203c-49b8-4f5f-93e7-3edae4597a97.png', 'actif', 0.00, 0, '2026-07-21 00:41:29', 0),
(4, 1, 'Marouane', 'marouane', 'yes this boutique is better', 'http://localhost:3000/uploads/boutiques/logo-b39ed692-6251-4bea-8590-eeb01f751f5e.png', NULL, 'actif', 0.00, 0, '2026-07-21 10:47:52', 0),
(5, 1, 'Saadi', 'saadi', 'saadi is the better sotre for you', 'http://localhost:3000/uploads/boutiques/logo-e22b0c6d-b522-4cc3-baf0-8b4bf622bba4.png', NULL, 'actif', 0.00, 0, '2026-07-21 11:25:11', 0),
(6, 1, 'stage inis', 'stage-inis', 'ubbhffffffffffff', 'http://localhost:3000/uploads/boutiques/logo-acd23dab-222b-4ed0-8392-d3dc184e2dfd.png', 'http://localhost:3000/uploads/boutiques/banniere-1b74aa41-f230-49ae-b3ee-bb4aa0e1526a.png', 'actif', 0.00, 0, '2026-07-21 11:42:14', 0),
(7, 8, 'shopBeniMellal', 'shopbenimellal', 'it is a boutique from contry beni melle a vendu wears', 'http://localhost:3000/uploads/boutiques/logo-f352aba8-b834-44b9-bb1b-5bec8e64976e.png', 'http://localhost:3000/uploads/boutiques/banniere-2bb12a6a-f4ee-4aae-b6bc-bd6f7c6ef834.png', 'actif', 0.00, 0, '2026-07-22 13:32:34', 0);

-- --------------------------------------------------------

--
-- Table structure for table `boutiques_suivies`
--

CREATE TABLE `boutiques_suivies` (
  `id_boutique_suivie` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `date_suivi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `boutiques_suivies`
--

INSERT INTO `boutiques_suivies` (`id_boutique_suivie`, `id_user`, `id_boutique`, `date_suivi`) VALUES
(2, 1, 1, '2026-07-20 12:02:31'),
(4, 1, 2, '2026-07-20 13:21:21'),
(11, 8, 5, '2026-07-22 01:03:36'),
(17, 8, 2, '2026-07-22 13:11:35');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id_categorie` int(10) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `icone` varchar(255) DEFAULT NULL,
  `id_categorie_parent` int(10) UNSIGNED DEFAULT NULL,
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id_categorie`, `nom`, `icone`, `id_categorie_parent`) VALUES
(1, 'Inf', 'pc.png', NULL),
(2, 'Téléphones', 'phone.png', NULL),
(3, 'Accessoires', 'accessories.png', 2);

-- --------------------------------------------------------

--
-- Table structure for table `commandes`
--

CREATE TABLE `commandes` (
  `id_commande` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `id_adresse` int(10) UNSIGNED NOT NULL,
  `statut` enum('en_attente','confirmee','expediee','livree','annulee','remboursee') NOT NULL DEFAULT 'en_attente',
  `montant_total` decimal(10,2) NOT NULL,
  `date_commande` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commandes`
--

INSERT INTO `commandes` (`id_commande`, `id_user`, `id_adresse`, `statut`, `montant_total`, `date_commande`) VALUES
(1, 1, 1, 'confirmee', 9950.00, '2026-07-13 21:50:21'),
(2, 1, 1, 'livree', 12000.00, '2026-07-13 21:50:21');

-- --------------------------------------------------------

--
-- Table structure for table `commande_lignes`
--

CREATE TABLE `commande_lignes` (
  `id_commande_ligne` int(10) UNSIGNED NOT NULL,
  `id_commande` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL,
  `prix_unitaire` decimal(10,2) NOT NULL,
  `sous_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commande_lignes`
--

INSERT INTO `commande_lignes` (`id_commande_ligne`, `id_commande`, `id_produit`, `id_boutique`, `quantite`, `prix_unitaire`, `sous_total`) VALUES
(1, 1, 1, 1, 1, 9500.00, 9500.00),
(2, 1, 2, 1, 1, 450.00, 450.00),
(3, 2, 3, 2, 1, 12000.00, 12000.00);

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id_conversation` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_maj` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id_conversation`, `id_user`, `id_boutique`, `date_creation`, `date_maj`) VALUES
(1, 8, 7, '2026-07-27 12:28:06', '2026-07-27 12:28:06'),
(2, 8, 7, '2026-07-27 12:28:29', '2026-07-27 12:28:29'),
(3, 10, 3, '2026-07-27 15:28:48', '2026-07-27 15:28:48'),
(4, 10, 7, '2026-07-27 15:33:29', '2026-07-27 15:33:29'),
(5, 9, 7, '2026-07-27 15:37:27', '2026-07-27 15:37:27'),
(6, 8, 3, '2026-07-29 13:40:45', '2026-07-29 13:40:45');

-- --------------------------------------------------------

--
-- Table structure for table `factures_boutique`
--

CREATE TABLE `factures_boutique` (
  `id` int(11) NOT NULL,
  `boutique_id` int(10) UNSIGNED NOT NULL,
  `type_facture` enum('publicite','promotion','abonnement') NOT NULL,
  `reference_id` int(11) NOT NULL,
  `moyen_paiement_id` int(10) UNSIGNED NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `statut` enum('en_attente','paye','echoue','rembourse') NOT NULL,
  `reference_transaction` varchar(255) DEFAULT NULL,
  `date_facture` datetime NOT NULL,
  `date_paiement` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `factures_boutique`
--

INSERT INTO `factures_boutique` (`id`, `boutique_id`, `type_facture`, `reference_id`, `moyen_paiement_id`, `montant`, `statut`, `reference_transaction`, `date_facture`, `date_paiement`) VALUES
(1, 7, 'promotion', 1, 5, 1000.00, 'paye', 'SIMU-ms4nnj35-s2ixe5', '2026-07-28 13:51:49', '2026-07-28 13:51:49'),
(2, 7, 'promotion', 2, 6, 2000.00, 'paye', 'SIMU-ms4noqo4-b4tdop', '2026-07-28 13:52:45', '2026-07-28 13:52:45'),
(3, 7, 'promotion', 9, 8, 1000.00, 'paye', 'tx_90b3e121-92d8-49b9-b2b6-41ba8393a1fa', '2026-07-29 12:42:30', '2026-07-29 12:42:30');

-- --------------------------------------------------------

--
-- Table structure for table `favoris`
--

CREATE TABLE `favoris` (
  `id_favori` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favoris`
--

INSERT INTO `favoris` (`id_favori`, `id_user`, `id_produit`, `date_ajout`) VALUES
(8, 1, 2, '2026-07-19 17:43:32'),
(24, 8, 4, '2026-07-23 15:38:47'),
(25, 8, 1, '2026-07-23 16:23:41'),
(27, 8, 5, '2026-07-24 13:28:11'),
(28, 8, 6, '2026-07-24 13:28:12');

-- --------------------------------------------------------

--
-- Table structure for table `infoboutique`
--

CREATE TABLE `infoboutique` (
  `id` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `tele` varchar(20) DEFAULT NULL,
  `emailprof` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `infoboutique`
--

INSERT INTO `infoboutique` (`id`, `id_boutique`, `adresse`, `tele`, `emailprof`, `instagram`, `facebook`) VALUES
(1, 3, 'casa', '+212 6786544', 'mar@gmail.com', NULL, NULL),
(2, 4, 'beni mellel', '+2122 56789088', 'this@gmail.com', NULL, NULL),
(3, 5, 'tadla', '+@212 666666666', 'saadi@gmail.com', NULL, NULL),
(4, 6, 'mohmmadia', '+212 66666666', 'mail@mail.com', '@marouane_oukh', 'facebook.com/marouane_Ou'),
(5, 7, 'beni mellal', '+212 66666666', 'contact@gmail.com', '@marouane_oukh', 'facebook.com/marouane_Ou');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id_message` int(10) UNSIGNED NOT NULL,
  `id_conversation` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED DEFAULT NULL,
  `contenu` text NOT NULL,
  `type_message` enum('texte','image','fichier','produit','systeme') NOT NULL DEFAULT 'texte',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_maj` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------------

--
-- Table structure for table `messages_pieces_jointes`
--

CREATE TABLE `messages_pieces_jointes` (
  `id_piece_jointe` int(10) UNSIGNED NOT NULL,
  `id_message` int(10) UNSIGNED NOT NULL,
  `url_fichier` varchar(255) NOT NULL,
  `nom_fichier` varchar(255) DEFAULT NULL,
  `type_fichier` varchar(100) DEFAULT NULL,
  `taille_fichier` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages_statuts`
--

CREATE TABLE `messages_statuts` (
  `id_message_statut` int(10) UNSIGNED NOT NULL,
  `id_message` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `statut` enum('envoye','recu','lu') NOT NULL DEFAULT 'envoye',
  `date_lecture` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages_statuts`
--

-- --------------------------------------------------------

--
-- Table structure for table `moyens_paiement`
--

CREATE TABLE `moyens_paiement` (
  `id_moyen_paiement` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `fournisseur` varchar(100) NOT NULL,
  `type` enum('carte','portefeuille','virement','autre') NOT NULL DEFAULT 'carte',
  `jeton_paiement` varchar(255) NOT NULL,
  `derniers_chiffres` varchar(4) DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `est_defaut` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `moyens_paiement`
--

INSERT INTO `moyens_paiement` (`id_moyen_paiement`, `id_user`, `fournisseur`, `type`, `jeton_paiement`, `derniers_chiffres`, `date_expiration`, `est_defaut`, `date_creation`) VALUES
(1, 1, 'Stripe', 'carte', 'tok_123456', '1234', '2028-12-31', 1, '2026-07-13 21:50:21'),
(2, 2, 'PayPal', 'portefeuille', 'tok_789456', NULL, NULL, 1, '2026-07-13 21:50:21'),
(5, 8, 'simulation', 'carte', 'SIMU-ms4nnj35-9wtk4i', '2345', '0000-00-00', 0, '2026-07-28 13:51:49'),
(6, 8, 'simulation', 'carte', 'SIMU-ms4noqo4-wkb5cn', '7665', '0000-00-00', 0, '2026-07-28 13:52:45'),
(7, 1, 'simulated', 'carte', '1', '1', '0000-00-00', 0, '2026-07-29 12:33:11'),
(8, 8, 'simulated', 'carte', 'tok_4f58b715-50e6-488f-9c18-b42307ac8d93', '9012', '2011-11-01', 0, '2026-07-29 12:42:30');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id_notification` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `type` varchar(100) NOT NULL,
  `contenu` text NOT NULL,
  `lien` varchar(255) DEFAULT NULL,
  `lu` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id_notification`, `id_user`, `type`, `contenu`, `lien`, `lu`, `date_creation`) VALUES
(1, 8, 'commande', 'Votre commande #CMD-1042 a ete expediee.', '/suivi-commandes', 1, '2026-07-20 13:49:50'),
(2, 1, 'paiement', 'Paiement confirme pour votre commande #CMD-1041.', '/mes-commandes', 1, '2026-07-20 11:04:50'),
(3, 1, 'promotion', 'Une promotion est disponible dans une boutique que vous suivez.', '/soldes', 1, '2026-07-19 14:04:50'),
(4, 1, 'message', 'Vous avez recu un nouveau message de Boutique Atlas.', '/messages', 1, '2026-07-18 14:04:50'),
(5, 1, 'boutique', 'La boutique Maison Noura a ajoute de nouveaux produits.', '/boutiques', 1, '2026-07-15 14:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `paiements`
--

CREATE TABLE `paiements` (
  `id_paiement` int(10) UNSIGNED NOT NULL,
  `id_commande` int(10) UNSIGNED NOT NULL,
  `id_moyen_paiement` int(10) UNSIGNED DEFAULT NULL,
  `montant` decimal(10,2) NOT NULL,
  `methode` varchar(50) NOT NULL,
  `fournisseur` varchar(100) DEFAULT NULL,
  `statut` enum('en_attente','valide','echoue','rembourse') NOT NULL DEFAULT 'en_attente',
  `reference_transaction` varchar(150) DEFAULT NULL,
  `date_paiement` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `panier_items`
--

CREATE TABLE `panier_items` (
  `id_panier_item` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `est_enregistre` tinyint(1) NOT NULL DEFAULT 0,
  `date_ajout` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `panier_items`
--

INSERT INTO `panier_items` (`id_panier_item`, `id_user`, `id_produit`, `quantite`, `est_enregistre`, `date_ajout`) VALUES
(1, 1, 1, 1, 0, '2026-07-13 21:50:21'),
(2, 1, 2, 2, 0, '2026-07-13 21:50:21'),
(8, 8, 5, 5, 0, '2026-07-24 12:12:40'),
(10, 1, 5, 2, 0, '2026-07-24 12:16:17'),
(11, 8, 6, 8, 0, '2026-07-24 12:55:53'),
(14, 8, 10, 2, 0, '2026-07-29 12:56:01');

-- --------------------------------------------------------

--
-- Table structure for table `plans_tarifs`
--

CREATE TABLE `plans_tarifs` (
  `id` int(10) UNSIGNED NOT NULL,
  `nom_plan` varchar(50) NOT NULL,
  `type_cible` enum('produit','boutique') NOT NULL,
  `duree_jours` int(10) UNSIGNED NOT NULL,
  `prix` decimal(10,2) NOT NULL,
  `priorite` int(10) UNSIGNED DEFAULT 0,
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `modifie_par` int(10) UNSIGNED DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_maj` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans_tarifs`
--

INSERT INTO `plans_tarifs` (`id`, `nom_plan`, `type_cible`, `duree_jours`, `prix`, `priorite`, `statut`, `modifie_par`, `date_creation`, `date_maj`) VALUES
(1, 'pro', 'produit', 10, 1000.00, 1, 'actif', 1, '2026-07-23 13:00:40', '2026-07-28 13:01:23'),
(2, 'max', 'produit', 10, 2000.00, 1, 'actif', 1, '2026-07-23 13:00:40', '2026-07-28 13:15:35');

-- --------------------------------------------------------

--
-- Table structure for table `produits`
--

CREATE TABLE `produits` (
  `id_produit` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `id_categorie` int(10) UNSIGNED DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `prix` decimal(10,2) NOT NULL,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `statut` enum('brouillon','en_ligne','rupture','archive') NOT NULL DEFAULT 'brouillon',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_maj` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `est_vedette` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produits`
--

INSERT INTO `produits` (`id_produit`, `id_boutique`, `id_categorie`, `nom`, `description`, `prix`, `stock`, `statut`, `date_creation`, `date_maj`, `est_vedette`) VALUES
(1, 1, 1, 'PC Portable Dell', 'Core i7 16Go RAM', 9500.00, 10, 'en_ligne', '2026-07-13 21:50:21', '2026-07-15 19:43:12', 1),
(2, 1, 1, 'Clavier Gamer', 'RGB mécanique', 450.00, 20, 'en_ligne', '2026-07-13 21:50:21', '2026-07-13 21:50:21', 0),
(3, 2, 2, 'iPhone 15', '128 Go Noir', 12000.00, 5, 'en_ligne', '2026-07-13 21:50:21', '2026-07-13 21:50:21', 0),
(4, 3, 2, 'redmi not 11', 'g gnon nnin', 200.00, 5, 'en_ligne', '2026-07-21 13:59:29', '2026-07-21 13:59:29', 0),
(5, 3, 2, 'redmi not 11', 'iiiiiiiiiiiiiiiiiii', 2000.00, 5, 'en_ligne', '2026-07-23 16:29:32', '2026-07-23 16:29:32', 0),
(6, 3, 1, 'hya', 'ddddddddddddddddddddddd', 60.00, 8, 'en_ligne', '2026-07-23 16:29:57', '2026-07-23 16:29:57', 0),
(9, 7, 1, 'laptop asus rog', 'hhhhhhhhhhhhhhhhhhhh', 2000.00, 1, 'en_ligne', '2026-07-27 13:12:35', '2026-07-27 13:12:35', 0),
(10, 7, 2, 'tstststs s', 'it is for the test soldes', 20000.00, 2, 'en_ligne', '2026-07-29 12:55:49', '2026-07-29 12:55:49', 0);

-- --------------------------------------------------------

--
-- Table structure for table `produit_medias`
--

CREATE TABLE `produit_medias` (
  `id_media` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED NOT NULL,
  `type` enum('image','video') NOT NULL DEFAULT 'video',
  `url` varchar(255) NOT NULL,
  `ordre` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produit_medias`
--

INSERT INTO `produit_medias` (`id_media`, `id_produit`, `type`, `url`, `ordre`) VALUES
(1, 1, 'image', 'images/dell.jpg', 1),
(2, 2, 'image', 'images/clavier.jpg', 1),
(3, 3, 'image', 'images/iphone15.jpg', 1),
(4, 4, 'image', 'http://localhost:3000/uploads/produits/image-882582a9-088f-4a21-bfcd-08728974bc2a.png', 0),
(5, 4, 'image', 'http://localhost:3000/uploads/produits/image-5dac0d39-7093-406a-92d9-3c00cc184fa7.png', 1),
(6, 5, 'image', 'http://localhost:3000/uploads/produits/image-6ee3f900-3d89-4659-913c-33002ad2c4e9.png', 0),
(7, 5, 'image', 'http://localhost:3000/uploads/produits/image-e7804498-a4c0-44af-a862-205467440fc3.png', 1),
(8, 6, 'image', 'http://localhost:3000/uploads/produits/image-7fe81280-76ff-4a47-a4f0-1d5b343246c5.png', 0),
(12, 9, 'video', 'http://localhost:3000/uploads/produits/video-125fa045-4575-4003-b134-3e3dea267898.mp4', 0),
(13, 10, 'image', 'http://localhost:3000/uploads/produits/image-5e66ed4f-8660-4c33-a7f7-4c7a67180a31.png', 0);

-- --------------------------------------------------------

--
-- Table structure for table `promouvoir`
--

CREATE TABLE `promouvoir` (
  `id_promotion` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED NOT NULL,
  `plan` varchar(100) NOT NULL,
  `plan_tarif_id` int(10) UNSIGNED DEFAULT NULL,
  `priorite` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `statut` enum('en_attente','active','expiree','annulee') NOT NULL DEFAULT 'en_attente',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `promouvoir`
--

INSERT INTO `promouvoir` (`id_promotion`, `id_produit`, `plan`, `plan_tarif_id`, `priorite`, `date_debut`, `date_fin`, `statut`, `date_creation`) VALUES
(1, 9, 'pro', NULL, 1, '2026-07-28 13:51:49', '2026-08-07 13:51:49', 'active', '2026-07-28 13:51:49'),
(2, 9, 'max', NULL, 1, '2026-07-28 13:52:45', '2026-08-07 13:52:45', 'active', '2026-07-28 13:52:45'),
(3, 9, 'pro', 1, 1, '2026-07-29 12:42:30', '2026-08-08 12:42:30', 'active', '2026-07-29 12:42:30');

-- --------------------------------------------------------

--
-- Table structure for table `publicites`
--

CREATE TABLE `publicites` (
  `id_publicite` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED DEFAULT NULL,
  `budget` decimal(10,2) NOT NULL,
  `cout_par_clic` decimal(10,2) NOT NULL,
  `impressions` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `clics` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `statut` enum('en_attente','active','en_pause','terminee') NOT NULL DEFAULT 'en_attente',
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `remboursements`
--

CREATE TABLE `remboursements` (
  `id_remboursement` int(10) UNSIGNED NOT NULL,
  `id_paiement` int(10) UNSIGNED NOT NULL,
  `id_commande_ligne` int(10) UNSIGNED NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `statut` enum('demande','approuve','refuse','traite') NOT NULL DEFAULT 'demande',
  `id_admin` int(10) UNSIGNED DEFAULT NULL,
  `date_demande` datetime NOT NULL DEFAULT current_timestamp(),
  `date_traitement` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reponses_avis`
--

CREATE TABLE `reponses_avis` (
  `id_reponse` int(10) UNSIGNED NOT NULL,
  `id_avis` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `reponse` text NOT NULL,
  `date_creation` datetime DEFAULT current_timestamp(),
  `date_modification` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reponses_avis`
--

INSERT INTO `reponses_avis` (`id_reponse`, `id_avis`, `id_boutique`, `reponse`, `date_creation`, `date_modification`) VALUES
(1, 15, 7, 'thank you brother for this comment', '2026-07-25 15:30:12', '2026-07-25 15:30:12');

-- --------------------------------------------------------

--
-- Table structure for table `revenus_vendeur`
--

CREATE TABLE `revenus_vendeur` (
  `id_revenu` int(10) UNSIGNED NOT NULL,
  `id_boutique` int(10) UNSIGNED NOT NULL,
  `id_commande_ligne` int(10) UNSIGNED NOT NULL,
  `montant_brut` decimal(10,2) NOT NULL,
  `commission` decimal(10,2) NOT NULL,
  `montant_net` decimal(10,2) NOT NULL,
  `statut` enum('en_attente','disponible','verse','annule') NOT NULL DEFAULT 'en_attente',
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `signalements`
--

CREATE TABLE `signalements` (
  `id_signalement` int(10) UNSIGNED NOT NULL,
  `id_user` int(10) UNSIGNED NOT NULL,
  `type_cible` enum('produit','boutique','utilisateur','avis','message') NOT NULL,
  `id_cible` int(10) UNSIGNED NOT NULL,
  `motif` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `statut` enum('ouvert','en_cours','resolu','rejete') NOT NULL DEFAULT 'ouvert',
  `id_admin` int(10) UNSIGNED DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_traitement` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `signalements`
--

INSERT INTO `signalements` (`id_signalement`, `id_user`, `type_cible`, `id_cible`, `motif`, `description`, `statut`, `id_admin`, `date_creation`, `date_traitement`) VALUES
(1, 1, 'boutique', 1, 'autre', 'jjjjkkkk', '', NULL, '2026-07-16 20:28:08', NULL),
(2, 1, 'boutique', 1, 'autre', 'jjjjkkkk', '', NULL, '2026-07-16 20:28:10', NULL),
(3, 1, 'boutique', 1, 'autre', 'jjjjkkkk', '', NULL, '2026-07-16 20:28:10', NULL),
(4, 1, 'boutique', 1, 'autre', 'finish', 'en_cours', NULL, '2026-07-16 20:28:55', NULL),
(5, 1, 'boutique', 1, 'autre', 'finish', 'en_cours', NULL, '2026-07-16 20:29:39', NULL),
(6, 1, 'boutique', 1, 'autre', 'finish', 'en_cours', NULL, '2026-07-16 20:29:39', NULL),
(7, 1, 'boutique', 1, 'autre', 'finish', 'en_cours', NULL, '2026-07-16 20:29:39', NULL),
(8, 1, 'boutique', 1, 'autre', 'finish test', 'en_cours', NULL, '2026-07-16 20:29:54', NULL),
(9, 1, 'boutique', 2, 'arnaque', 'akhir sig', 'en_cours', NULL, '2026-07-20 12:47:14', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `soldes`
--

CREATE TABLE `soldes` (
  `id_solde` int(10) UNSIGNED NOT NULL,
  `id_produit` int(10) UNSIGNED NOT NULL,
  `type_reduction` enum('pourcentage','montant_fixe') NOT NULL,
  `valeur_reduction` decimal(10,2) NOT NULL,
  `prix_promo` decimal(10,2) NOT NULL,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `statut` enum('en_attente','active','expiree','annulee') NOT NULL DEFAULT 'en_attente',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `soldes`
--

INSERT INTO `soldes` (`id_solde`, `id_produit`, `type_reduction`, `valeur_reduction`, `prix_promo`, `date_debut`, `date_fin`, `statut`, `date_creation`) VALUES
(1, 1, 'pourcentage', 20.00, 100.00, '2026-07-17 11:29:40', '2026-07-30 11:29:40', 'active', '2026-07-17 11:29:40'),
(3, 9, 'pourcentage', 20.00, 1000.00, '2026-07-23 00:00:00', '2026-07-31 00:00:00', 'en_attente', '2026-07-28 14:23:36'),
(5, 10, 'pourcentage', 30.00, 299.97, '2026-07-29 13:00:00', '2026-07-31 13:01:00', 'active', '2026-07-29 13:01:05');

-- --------------------------------------------------------

--
-- Table structure for table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id_user` int(10) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `tele` varchar(20) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `statut` enum('actif','suspendu') NOT NULL DEFAULT 'actif',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `derniere_connexion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id_user`, `nom`, `prenom`, `email`, `password`, `tele`, `logo_url`, `role`, `statut`, `date_creation`, `derniere_connexion`) VALUES
(1, 'Oukhmou', 'Marouane', 'marouane@gmail.com', 'pass123', '0611111111', NULL, '', 'actif', '2026-07-13 21:50:20', NULL),
(2, 'Amine', 'Yassine', 'amine@gmail.com', 'pass123', '0622222222', NULL, '', 'actif', '2026-07-13 21:50:20', NULL),
(3, 'Admin', 'System', 'admin@gmail.com', 'admin123', '0633333333', NULL, 'admin', 'actif', '2026-07-13 21:50:20', NULL),
(5, 'Marouane', 'oukhmou', 'ghoufrane@gmail.com', '$2b$10$VoZlMCQOCdU8oUdLKkHUIuZ9zdXRGC8FN63SNSr/bPMM4nYcXHYIW', NULL, NULL, 'user', 'actif', '2026-07-21 19:02:13', NULL),
(6, 'ahmed', 'hamid', 'hamid@gmail.com', '$2b$10$/Tb7J11bFjwwFPdww8/8NuEsUNtT1b.tCmwq9E2AavJFJPnsxWGa2', NULL, NULL, 'user', 'actif', '2026-07-21 19:04:19', NULL),
(7, 'simo', 'simo', 'simo@gmail.com', '$2b$10$f5M6fn1irwNfuMALOqZst.lR5bQliW60dU8CoDYJLtqpB974aZjoi', NULL, NULL, 'user', 'actif', '2026-07-21 19:13:55', NULL),
(8, 'Oukhmou', 'Ali', 'ali@gmail.com', '$2b$10$a6gk.O6zIvYln8A.9WY8L.wycZkgOzjdmAAPcALPNuYEIzSZFjHbe', '+212 666666666', 'http://localhost:3000/uploads/utilisateurs/avatar-2cd35af2-f558-4172-9a91-3f1589188dfd.png', 'user', 'actif', '2026-07-21 19:50:02', NULL),
(9, 'ghoufrane', 'rayhane', 'ghoufrane1@gmail.com', '$2b$10$eV.JCNmdBtPwRpx0bgqBquyubAgrEHIFtQmuxM724S1wZYxFFghLy', NULL, NULL, 'user', 'actif', '2026-07-25 13:00:54', NULL),
(10, 'user', 'user', 'user@gmail.com', '$2b$10$z5CF2uXVlb.uCpMbcQRs3O8kWY3Kbn2j.UQJ6vDFiOFwSqKM0cAy6', NULL, NULL, 'user', 'actif', '2026-07-27 11:58:24', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adresses`
--
ALTER TABLE `adresses`
  ADD PRIMARY KEY (`id_adresse`),
  ADD KEY `fk_adresses_user` (`id_user`);

--
-- Indexes for table `avis`
--
ALTER TABLE `avis`
  ADD PRIMARY KEY (`id_avis`),
  ADD KEY `fk_avis_produit` (`id_cible`),
  ADD KEY `fk_avis_user` (`id_user`);

--
-- Indexes for table `boutiques`
--
ALTER TABLE `boutiques`
  ADD PRIMARY KEY (`id_boutique`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_boutiques_user` (`id_user`);

--
-- Indexes for table `boutiques_suivies`
--
ALTER TABLE `boutiques_suivies`
  ADD PRIMARY KEY (`id_boutique_suivie`),
  ADD UNIQUE KEY `uq_boutiques_suivies_user_boutique` (`id_user`,`id_boutique`),
  ADD KEY `fk_boutiques_suivies_boutique` (`id_boutique`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id_categorie`),
  ADD KEY `fk_categories_parent` (`id_categorie_parent`);

--
-- Indexes for table `commandes`
--
ALTER TABLE `commandes`
  ADD PRIMARY KEY (`id_commande`),
  ADD KEY `fk_commandes_adresse` (`id_adresse`),
  ADD KEY `idx_commandes_user` (`id_user`);

--
-- Indexes for table `commande_lignes`
--
ALTER TABLE `commande_lignes`
  ADD PRIMARY KEY (`id_commande_ligne`),
  ADD KEY `fk_commande_lignes_produit` (`id_produit`),
  ADD KEY `fk_commande_lignes_boutique` (`id_boutique`),
  ADD KEY `idx_commande_lignes_commande` (`id_commande`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id_conversation`),
  ADD KEY `fk_conversations_user` (`id_user`),
  ADD KEY `fk_conversations_boutique` (`id_boutique`);

--
-- Indexes for table `factures_boutique`
--
ALTER TABLE `factures_boutique`
  ADD PRIMARY KEY (`id`),
  ADD KEY `boutique_id` (`boutique_id`),
  ADD KEY `moyen_paiement_id` (`moyen_paiement_id`);

--
-- Indexes for table `favoris`
--
ALTER TABLE `favoris`
  ADD PRIMARY KEY (`id_favori`),
  ADD UNIQUE KEY `uq_favoris_user_produit` (`id_user`,`id_produit`),
  ADD KEY `fk_favoris_produit` (`id_produit`);

--
-- Indexes for table `infoboutique`
--
ALTER TABLE `infoboutique`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_boutique` (`id_boutique`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id_message`),
  ADD KEY `fk_messages_user` (`id_user`),
  ADD KEY `fk_messages_produit` (`id_produit`),
  ADD KEY `idx_messages_conversation` (`id_conversation`);

--
-- Indexes for table `messages_pieces_jointes`
--
ALTER TABLE `messages_pieces_jointes`
  ADD PRIMARY KEY (`id_piece_jointe`),
  ADD KEY `fk_messages_pieces_jointes_message` (`id_message`);

--
-- Indexes for table `messages_statuts`
--
ALTER TABLE `messages_statuts`
  ADD PRIMARY KEY (`id_message_statut`),
  ADD UNIQUE KEY `uq_messages_statuts_message_user` (`id_message`,`id_user`),
  ADD KEY `fk_messages_statuts_user` (`id_user`);

--
-- Indexes for table `moyens_paiement`
--
ALTER TABLE `moyens_paiement`
  ADD PRIMARY KEY (`id_moyen_paiement`),
  ADD KEY `fk_moyens_paiement_user` (`id_user`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id_notification`),
  ADD KEY `idx_notifications_user_lu` (`id_user`,`lu`);

--
-- Indexes for table `paiements`
--
ALTER TABLE `paiements`
  ADD PRIMARY KEY (`id_paiement`),
  ADD KEY `fk_paiements_commande` (`id_commande`),
  ADD KEY `fk_paiements_moyen_paiement` (`id_moyen_paiement`);

--
-- Indexes for table `panier_items`
--
ALTER TABLE `panier_items`
  ADD PRIMARY KEY (`id_panier_item`),
  ADD UNIQUE KEY `uq_panier_user_produit` (`id_user`,`id_produit`),
  ADD KEY `fk_panier_items_produit` (`id_produit`);

--
-- Indexes for table `plans_tarifs`
--
ALTER TABLE `plans_tarifs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom_plan` (`nom_plan`),
  ADD KEY `fk_plan_admin` (`modifie_par`);

--
-- Indexes for table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id_produit`),
  ADD KEY `idx_produits_categorie` (`id_categorie`),
  ADD KEY `idx_produits_boutique` (`id_boutique`);

--
-- Indexes for table `produit_medias`
--
ALTER TABLE `produit_medias`
  ADD PRIMARY KEY (`id_media`),
  ADD KEY `fk_produit_medias_produit` (`id_produit`);

--
-- Indexes for table `promouvoir`
--
ALTER TABLE `promouvoir`
  ADD PRIMARY KEY (`id_promotion`),
  ADD KEY `fk_promouvoir_produit` (`id_produit`),
  ADD KEY `fk_promouvoir_plan` (`plan_tarif_id`);

--
-- Indexes for table `publicites`
--
ALTER TABLE `publicites`
  ADD PRIMARY KEY (`id_publicite`),
  ADD KEY `fk_publicites_boutique` (`id_boutique`),
  ADD KEY `fk_publicites_produit` (`id_produit`);

--
-- Indexes for table `remboursements`
--
ALTER TABLE `remboursements`
  ADD PRIMARY KEY (`id_remboursement`),
  ADD KEY `fk_remboursements_paiement` (`id_paiement`),
  ADD KEY `fk_remboursements_commande_ligne` (`id_commande_ligne`),
  ADD KEY `fk_remboursements_admin` (`id_admin`);

--
-- Indexes for table `reponses_avis`
--
ALTER TABLE `reponses_avis`
  ADD PRIMARY KEY (`id_reponse`),
  ADD UNIQUE KEY `id_avis` (`id_avis`),
  ADD KEY `id_boutique` (`id_boutique`);

--
-- Indexes for table `revenus_vendeur`
--
ALTER TABLE `revenus_vendeur`
  ADD PRIMARY KEY (`id_revenu`),
  ADD UNIQUE KEY `uq_revenus_vendeur_commande_ligne` (`id_commande_ligne`),
  ADD KEY `fk_revenus_vendeur_boutique` (`id_boutique`);

--
-- Indexes for table `signalements`
--
ALTER TABLE `signalements`
  ADD PRIMARY KEY (`id_signalement`),
  ADD KEY `fk_signalements_user` (`id_user`),
  ADD KEY `fk_signalements_admin` (`id_admin`),
  ADD KEY `idx_signalements_cible` (`type_cible`,`id_cible`);

--
-- Indexes for table `soldes`
--
ALTER TABLE `soldes`
  ADD PRIMARY KEY (`id_solde`),
  ADD KEY `fk_soldes_produit` (`id_produit`);

--
-- Indexes for table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adresses`
--
ALTER TABLE `adresses`
  MODIFY `id_adresse` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `avis`
--
ALTER TABLE `avis`
  MODIFY `id_avis` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `boutiques`
--
ALTER TABLE `boutiques`
  MODIFY `id_boutique` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `boutiques_suivies`
--
ALTER TABLE `boutiques_suivies`
  MODIFY `id_boutique_suivie` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id_categorie` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `commandes`
--
ALTER TABLE `commandes`
  MODIFY `id_commande` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `commande_lignes`
--
ALTER TABLE `commande_lignes`
  MODIFY `id_commande_ligne` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id_conversation` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `factures_boutique`
--
ALTER TABLE `factures_boutique`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `favoris`
--
ALTER TABLE `favoris`
  MODIFY `id_favori` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `infoboutique`
--
ALTER TABLE `infoboutique`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id_message` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `messages_pieces_jointes`
--
ALTER TABLE `messages_pieces_jointes`
  MODIFY `id_piece_jointe` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages_statuts`
--
ALTER TABLE `messages_statuts`
  MODIFY `id_message_statut` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `moyens_paiement`
--
ALTER TABLE `moyens_paiement`
  MODIFY `id_moyen_paiement` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id_notification` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `paiements`
--
ALTER TABLE `paiements`
  MODIFY `id_paiement` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `panier_items`
--
ALTER TABLE `panier_items`
  MODIFY `id_panier_item` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `plans_tarifs`
--
ALTER TABLE `plans_tarifs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `produits`
--
ALTER TABLE `produits`
  MODIFY `id_produit` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `produit_medias`
--
ALTER TABLE `produit_medias`
  MODIFY `id_media` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `promouvoir`
--
ALTER TABLE `promouvoir`
  MODIFY `id_promotion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `publicites`
--
ALTER TABLE `publicites`
  MODIFY `id_publicite` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `remboursements`
--
ALTER TABLE `remboursements`
  MODIFY `id_remboursement` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reponses_avis`
--
ALTER TABLE `reponses_avis`
  MODIFY `id_reponse` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `revenus_vendeur`
--
ALTER TABLE `revenus_vendeur`
  MODIFY `id_revenu` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `signalements`
--
ALTER TABLE `signalements`
  MODIFY `id_signalement` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `soldes`
--
ALTER TABLE `soldes`
  MODIFY `id_solde` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id_user` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `adresses`
--
ALTER TABLE `adresses`
  ADD CONSTRAINT `fk_adresses_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `avis`
--
ALTER TABLE `avis`
  ADD CONSTRAINT `fk_avis_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `boutiques`
--
ALTER TABLE `boutiques`
  ADD CONSTRAINT `fk_boutiques_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `boutiques_suivies`
--
ALTER TABLE `boutiques_suivies`
  ADD CONSTRAINT `fk_boutiques_suivies_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boutiques_suivies_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`id_categorie_parent`) REFERENCES `categories` (`id_categorie`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `commandes`
--
ALTER TABLE `commandes`
  ADD CONSTRAINT `fk_commandes_adresse` FOREIGN KEY (`id_adresse`) REFERENCES `adresses` (`id_adresse`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_commandes_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `commande_lignes`
--
ALTER TABLE `commande_lignes`
  ADD CONSTRAINT `fk_commande_lignes_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_commande_lignes_commande` FOREIGN KEY (`id_commande`) REFERENCES `commandes` (`id_commande`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_commande_lignes_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON UPDATE CASCADE;

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conversations_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_conversations_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `factures_boutique`
--
ALTER TABLE `factures_boutique`
  ADD CONSTRAINT `factures_boutique_ibfk_1` FOREIGN KEY (`boutique_id`) REFERENCES `boutiques` (`id_boutique`),
  ADD CONSTRAINT `factures_boutique_ibfk_2` FOREIGN KEY (`moyen_paiement_id`) REFERENCES `moyens_paiement` (`id_moyen_paiement`);

--
-- Constraints for table `favoris`
--
ALTER TABLE `favoris`
  ADD CONSTRAINT `fk_favoris_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_favoris_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `infoboutique`
--
ALTER TABLE `infoboutique`
  ADD CONSTRAINT `fk_infoboutique_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`id_conversation`) REFERENCES `conversations` (`id_conversation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_messages_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_messages_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `messages_pieces_jointes`
--
ALTER TABLE `messages_pieces_jointes`
  ADD CONSTRAINT `fk_messages_pieces_jointes_message` FOREIGN KEY (`id_message`) REFERENCES `messages` (`id_message`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `messages_statuts`
--
ALTER TABLE `messages_statuts`
  ADD CONSTRAINT `fk_messages_statuts_message` FOREIGN KEY (`id_message`) REFERENCES `messages` (`id_message`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_messages_statuts_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `moyens_paiement`
--
ALTER TABLE `moyens_paiement`
  ADD CONSTRAINT `fk_moyens_paiement_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `paiements`
--
ALTER TABLE `paiements`
  ADD CONSTRAINT `fk_paiements_commande` FOREIGN KEY (`id_commande`) REFERENCES `commandes` (`id_commande`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_paiements_moyen_paiement` FOREIGN KEY (`id_moyen_paiement`) REFERENCES `moyens_paiement` (`id_moyen_paiement`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `panier_items`
--
ALTER TABLE `panier_items`
  ADD CONSTRAINT `fk_panier_items_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_panier_items_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `plans_tarifs`
--
ALTER TABLE `plans_tarifs`
  ADD CONSTRAINT `fk_plan_admin` FOREIGN KEY (`modifie_par`) REFERENCES `utilisateurs` (`id_user`);

--
-- Constraints for table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `fk_produits_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produits_categorie` FOREIGN KEY (`id_categorie`) REFERENCES `categories` (`id_categorie`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `produit_medias`
--
ALTER TABLE `produit_medias`
  ADD CONSTRAINT `fk_produit_medias_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `promouvoir`
--
ALTER TABLE `promouvoir`
  ADD CONSTRAINT `fk_promouvoir_plan` FOREIGN KEY (`plan_tarif_id`) REFERENCES `plans_tarifs` (`id`),
  ADD CONSTRAINT `fk_promouvoir_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `publicites`
--
ALTER TABLE `publicites`
  ADD CONSTRAINT `fk_publicites_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_publicites_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `remboursements`
--
ALTER TABLE `remboursements`
  ADD CONSTRAINT `fk_remboursements_admin` FOREIGN KEY (`id_admin`) REFERENCES `utilisateurs` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_remboursements_commande_ligne` FOREIGN KEY (`id_commande_ligne`) REFERENCES `commande_lignes` (`id_commande_ligne`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_remboursements_paiement` FOREIGN KEY (`id_paiement`) REFERENCES `paiements` (`id_paiement`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reponses_avis`
--
ALTER TABLE `reponses_avis`
  ADD CONSTRAINT `reponses_avis_ibfk_1` FOREIGN KEY (`id_avis`) REFERENCES `avis` (`id_avis`) ON DELETE CASCADE,
  ADD CONSTRAINT `reponses_avis_ibfk_2` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE;

--
-- Constraints for table `revenus_vendeur`
--
ALTER TABLE `revenus_vendeur`
  ADD CONSTRAINT `fk_revenus_vendeur_boutique` FOREIGN KEY (`id_boutique`) REFERENCES `boutiques` (`id_boutique`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_revenus_vendeur_commande_ligne` FOREIGN KEY (`id_commande_ligne`) REFERENCES `commande_lignes` (`id_commande_ligne`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `signalements`
--
ALTER TABLE `signalements`
  ADD CONSTRAINT `fk_signalements_admin` FOREIGN KEY (`id_admin`) REFERENCES `utilisateurs` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_signalements_user` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `soldes`
--
ALTER TABLE `soldes`
  ADD CONSTRAINT `fk_soldes_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
