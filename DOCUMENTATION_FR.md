# 📱 JobGraph - Système de Recommandation d'Emplois

## 📋 Description du Projet

**JobGraph** est une application mobile de recommandation d'emplois basée sur le matching des compétences. Elle utilise une base de données graphe **Neo4j** pour calculer des scores de pertinence entre les candidats et les offres d'emploi.

### Technologies Utilisées

| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js / Express.js |
| Base de données | Neo4j (Base de données graphe) |
| Frontend Mobile | React Native / Expo |
| Authentification | JWT (JSON Web Tokens) |
| Hashage mot de passe | bcrypt |

---

## 🏗️ Architecture du Projet

```
Nosql app/
├── backend/                    # Serveur API Node.js/Express
│   └── src/
│       ├── server.js           # Point d'entrée du serveur
│       ├── app.js              # Configuration Express
│       ├── config/             # Configuration (BDD, constantes)
│       ├── controllers/        # Logique métier
│       ├── middleware/         # Authentification, validation, erreurs
│       └── routes/             # Points d'API
└── mobile/                     # Application React Native/Expo
    ├── App.js                  # Point d'entrée de l'app
    └── src/
        ├── config/             # Configuration API
        ├── context/            # Gestion d'état global
        ├── navigation/         # Navigation entre écrans
        ├── components/         # Composants UI réutilisables
        ├── screens/            # Écrans de l'application
        └── theme/              # Système de design
```

---

## 🗄️ Modèle de Données Neo4j

### Schéma du Graphe

```
(Utilisateur) -[:POSSEDE]-> (Compétence) <-[:REQUIERT]- (Emploi)
(Utilisateur) -[:POSTULE_A]-> (Emploi)
```

### Nœuds (Nodes)

| Nœud | Propriétés |
|------|------------|
| `User` | id, name, email, password, role, title, createdAt |
| `Job` | id, title, description, salary, location, date_creation, recruiterId |
| `Skill` | name |

### Relations (Relationships)

| Relation | Description | Propriétés |
|----------|-------------|------------|
| `POSSEDE` | L'utilisateur possède une compétence | - |
| `REQUIERT` | L'emploi requiert une compétence | - |
| `POSTULE_A` | L'utilisateur a postulé à un emploi | id, status, coverLetter, appliedAt |

---

## 🔧 FICHIERS BACKEND

### 1. `server.js` - Point d'entrée du serveur

**Rôle** : Démarrer le serveur Express et initialiser la connexion à Neo4j

| Fonction | Description |
|----------|-------------|
| `startServer()` | Vérifie la connexion Neo4j et démarre le serveur HTTP |
| `process.on('SIGINT')` | Gestionnaire d'arrêt gracieux (ferme les connexions BDD) |
| `process.on('SIGTERM')` | Gestionnaire d'arrêt gracieux pour les signaux système |

---

### 2. `app.js` - Configuration Express

**Rôle** : Configure les middlewares et les routes de l'API

**Configuration** :
- `cors()` - Autorise les requêtes cross-origin
- `express.json()` - Parse le corps des requêtes JSON
- Logging des requêtes en mode développement

**Routes API** :
- `/api/auth` - Authentification
- `/api/users` - Gestion des utilisateurs
- `/api/jobs` - Gestion des offres d'emploi
- `/api/applications` - Gestion des candidatures
- `/api/recommendations` - Système de recommandation

---

### 3. `config/database.js` - Connexion Neo4j

**Rôle** : Gère la connexion et les requêtes vers Neo4j

| Fonction | Description |
|----------|-------------|
| `driver` | Instance du driver Neo4j avec pool de connexions |
| `getSession(mode)` | Retourne une nouvelle session BDD (READ/WRITE) |
| `runQuery(cypher, params, mode)` | Exécute des requêtes Cypher avec gestion auto des sessions |
| `verifyConnection()` | Teste la connectivité au démarrage |
| `closeConnection()` | Ferme la connexion pour un arrêt propre |

---

### 4. `config/constants.js` - Constantes de l'application

**Rôle** : Centralise les constantes utilisées dans l'application

| Constante | Valeurs |
|-----------|---------|
| `USER_ROLES` | `admin`, `recruteur`, `candidat` |
| `APPLICATION_STATUS` | `pending`, `reviewed`, `accepted`, `rejected` |
| `STATUS_CODES` | Codes HTTP (200, 201, 400, 401, 403, 404, 409, 500) |
| `ERROR_CODES` | Identifiants d'erreurs personnalisés |
| `PAGINATION` | page=1 par défaut, limit=10, max=100 |

---

### 5. `controllers/authController.js` - Contrôleur d'authentification

**Rôle** : Gère l'inscription, la connexion et le profil utilisateur

| Fonction | Description |
|----------|-------------|
| `generateToken(user)` | Crée un token JWT avec les infos utilisateur |
| `register(req, res)` | Inscrit un nouvel utilisateur avec mot de passe hashé |
| `login(req, res)` | Valide les identifiants et retourne un token JWT |
| `getProfile(req, res)` | Retourne le profil de l'utilisateur connecté avec ses compétences |
| `updateProfile(req, res)` | Met à jour le nom/titre de l'utilisateur |
| `changePassword(req, res)` | Valide l'ancien mot de passe et définit le nouveau |

---

### 6. `controllers/userController.js` - Contrôleur utilisateurs et compétences

**Rôle** : Gère les utilisateurs et leurs compétences (relation POSSEDE)

| Fonction | Description |
|----------|-------------|
| `getAllUsers(req, res)` | Admin : liste tous les utilisateurs avec pagination |
| `getUserById(req, res)` | Récupère un utilisateur par son ID |
| `deleteUser(req, res)` | Admin : supprime un utilisateur et toutes ses relations |
| `addSkills(req, res)` | Crée la relation `Utilisateur -[:POSSEDE]-> Compétence` |
| `removeSkill(req, res)` | Supprime la relation POSSEDE pour une compétence |
| `getMySkills(req, res)` | Retourne les compétences de l'utilisateur connecté |
| `getAllSkills(req, res)` | Liste toutes les compétences du système avec statistiques |

---

### 7. `controllers/jobController.js` - Contrôleur des offres d'emploi

**Rôle** : Opérations CRUD sur les offres d'emploi (relation REQUIERT)

| Fonction | Description |
|----------|-------------|
| `createJob(req, res)` | Crée une offre avec relations `Emploi -[:REQUIERT]-> Compétence` |
| `getAllJobs(req, res)` | Liste les offres avec filtres (salaire, lieu, compétences) |
| `getJobById(req, res)` | Détails d'une offre avec infos recruteur et nombre de candidats |
| `updateJob(req, res)` | Modifie une offre (propriétaire/admin uniquement) |
| `deleteJob(req, res)` | Supprime une offre et ses relations (propriétaire/admin) |
| `getMyJobs(req, res)` | Retourne les offres créées par le recruteur connecté |

---

### 8. `controllers/applicationController.js` - Contrôleur des candidatures

**Rôle** : Gère les candidatures (relation POSTULE_A)

| Fonction | Description |
|----------|-------------|
| `applyToJob(req, res)` | Crée la relation `Utilisateur -[:POSTULE_A]-> Emploi` |
| `getApplicationHistory(req, res)` | Historique des candidatures du candidat |
| `getJobApplicants(req, res)` | Liste les candidats pour une offre (recruteur) |
| `updateApplicationStatus(req, res)` | Accepter/refuser une candidature (recruteur) |
| `withdrawApplication(req, res)` | Le candidat retire sa candidature |
| `checkApplicationStatus(req, res)` | Vérifie si l'utilisateur a déjà postulé |

---

### 9. `controllers/recommendationController.js` - 🌟 Moteur de Recommandation

**Rôle** : Algorithme principal de recommandation basé sur le matching des compétences

| Fonction | Description |
|----------|-------------|
| `getRecommendations(req, res)` | Calcule les recommandations d'emploi pour l'utilisateur |
| `getJobRecommendation(req, res)` | Score de matching détaillé pour un emploi spécifique |

#### 📊 Formule du Score

```
Score = Compétences_Matchées / Compétences_Requises
```

#### Algorithme en détail :

1. **Récupérer** les compétences de l'utilisateur (relations POSSEDE)
2. **Pour chaque emploi**, récupérer les compétences requises (relations REQUIERT)
3. **Calculer** l'intersection (compétences matchées)
4. **Calculer** le score = matchées / requises
5. **Trier** par score décroissant

**Exemple** : Si un emploi requiert `[React, Node, MongoDB]` et que l'utilisateur possède `[React, Node]`, le score sera `2/3 = 66%`.

---

### 10. `middleware/auth.js` - Middleware d'authentification

**Rôle** : Vérification JWT et contrôle d'accès basé sur les rôles

| Fonction | Description |
|----------|-------------|
| `authenticate` | Vérifie le token JWT et attache l'utilisateur à `req.user` |
| `authorize(...roles)` | Vérifie que l'utilisateur a le rôle requis |
| `optionalAuth` | Authentifie si token présent, continue sinon |

---

### 11. `middleware/errorHandler.js` - Gestion des erreurs

**Rôle** : Gestion centralisée des erreurs

| Export | Description |
|--------|-------------|
| `ApiError` | Classe d'erreur personnalisée avec statusCode et errorCode |
| `notFoundHandler` | Gère les erreurs 404 pour les routes non définies |
| `errorHandler` | Gestionnaire global avec mapping des erreurs Neo4j/JWT |
| `asyncHandler` | Wrapper pour capturer les erreurs dans les routes async |

---

### 12. `middleware/validators.js` - Validation des entrées

**Rôle** : Middleware express-validator pour valider les requêtes

| Validateur | Description |
|------------|-------------|
| `registerValidation` | Valide nom, email, mot de passe, rôle |
| `loginValidation` | Valide email et mot de passe |
| `createJobValidation` | Valide titre, description, salaire, compétences |
| `skillsValidation` | Valide le tableau de compétences |
| `applyJobValidation` | Valide la candidature à un emploi |

---

## 📱 FICHIERS MOBILE (REACT NATIVE)

### 1. `App.js` - Point d'entrée

**Rôle** : Composant principal avec les providers

**Structure** :
- `SafeAreaProvider` - Gestion des zones sûres (encoche, etc.)
- `AuthProvider` - État d'authentification global
- `AppNavigator` - Routage de navigation

---

### 2. `context/AuthContext.js` - État d'authentification

**Rôle** : Gestion d'état globale de l'authentification avec React Context

| Fonction | Description |
|----------|-------------|
| `checkStoredAuth()` | Restaure l'état auth depuis AsyncStorage au démarrage |
| `login(email, password)` | Authentifie l'utilisateur et stocke le token |
| `register(userData)` | Crée un compte et stocke le token |
| `logout()` | Efface l'état auth et le stockage |
| `updateUser(userData)` | Met à jour le profil utilisateur |
| `refreshUser()` | Récupère les dernières données utilisateur |

**Valeurs exposées** : `user`, `token`, `loading`, `error`, `isAuthenticated`

---

### 3. `navigation/AppNavigator.js` - Routage des écrans

**Rôle** : Configuration React Navigation

**Structure de navigation** :

| Stack | Écrans | Utilisateurs |
|-------|--------|--------------|
| AuthStack | Login, Register | Non connectés |
| CandidateTabs | Jobs, Recommandations, Candidatures, Profil | Candidats |
| RecruiterTabs | Mes offres, Parcourir, Profil | Recruteurs |
| AdminTabs | Jobs, Profil | Administrateurs |

---

### 4. `config/api.js` - Client API

**Rôle** : Client Axios avec intercepteurs

| Module API | Endpoints |
|------------|-----------|
| `authAPI` | register, login, getProfile, updateProfile |
| `userAPI` | getSkills, addSkills, removeSkill |
| `jobAPI` | getAll, getById, create, update, delete, getMyJobs |
| `applicationAPI` | apply, getHistory, checkStatus, withdraw, getApplicants, updateStatus |
| `recommendationAPI` | getRecommendations, getJobRecommendation |

**Intercepteurs** :
- **Requête** : Ajoute le token Bearer depuis AsyncStorage
- **Réponse** : Gère les erreurs 401 (expiration du token)

---

### 5. `theme/index.js` - Système de Design

**Rôle** : Configuration de style centralisée

| Export | Contenu |
|--------|---------|
| `colors` | Couleurs primaires, secondaires, fond, texte, statuts |
| `spacing` | xs(4), sm(8), md(16), lg(24), xl(32), xxl(48) |
| `borderRadius` | sm(8), md(12), lg(16), xl(24), full(9999) |
| `typography` | Styles h1, h2, h3, body, bodySmall, caption, button |
| `shadows` | Configurations d'ombres sm, md, lg |

---

### 6. `components/index.js` - Composants UI réutilisables

**Rôle** : Composants UI partagés

| Composant | Description |
|-----------|-------------|
| `Button` | Bouton primaire/secondaire avec état de chargement |
| `Input` | Champ de texte avec label, icône et erreurs |
| `Card` | Conteneur carte (touchable ou statique) |
| `SkillBadge` | Badge de compétence avec bouton de suppression optionnel |
| `ScoreBadge` | Indicateur circulaire de score de matching (0-100%) |
| `LoadingScreen` | Indicateur de chargement plein écran |
| `EmptyState` | Placeholder pour liste vide avec action |
| `Header` | En-tête de section avec action optionnelle |
| `StatusBadge` | Indicateur de statut de candidature |
| `ProgressBar` | Barre de progression horizontale |

---

### 7. Fichiers des écrans

| Écran | Rôle |
|-------|------|
| `LoginScreen.js` | Connexion avec remplissage rapide de comptes démo |
| `RegisterScreen.js` | Inscription avec sélection du rôle (candidat/recruteur) |
| `JobsScreen.js` | Parcourir les offres avec recherche et filtres par salaire |
| `JobDetailsScreen.js` | Détails de l'offre, score de matching, bouton postuler, gestion candidats |
| `RecommendationsScreen.js` | Recommandations personnalisées triées par score de matching |
| `ProfileScreen.js` | Profil utilisateur avec gestion des compétences et déconnexion |
| `ApplicationsScreen.js` | Historique des candidatures avec suivi de statut |
| `RecruiterJobsScreen.js` | Offres publiées par le recruteur avec compteur de candidats |
| `CreateJobScreen.js` | Formulaire de création d'offre d'emploi |

---

## 🔐 Flux d'authentification

1. L'utilisateur s'inscrit ou se connecte
2. Le serveur génère un token JWT
3. Le token est stocké dans AsyncStorage (mobile)
4. Chaque requête API inclut le token dans l'en-tête `Authorization`
5. Le middleware `authenticate` vérifie le token
6. Les données utilisateur sont attachées à `req.user`

---

## 🌟 Flux de recommandation

1. Le candidat ajoute des compétences à son profil
2. Les recruteurs créent des offres avec des compétences requises
3. L'algorithme calcule le score de matching pour chaque offre
4. Les offres sont triées par score décroissant
5. Le candidat voit les compétences matchées et manquantes

---

## 📊 Rôles et permissions

| Action | Admin | Recruteur | Candidat |
|--------|-------|-----------|----------|
| Voir les offres | ✅ | ✅ | ✅ |
| Créer une offre | ✅ | ✅ | ❌ |
| Modifier/Supprimer une offre | ✅ | Ses offres seulement | ❌ |
| Postuler à une offre | ❌ | ❌ | ✅ |
| Voir les candidats | ✅ | Ses offres seulement | ❌ |
| Accepter/Refuser candidatures | ✅ | Ses offres seulement | ❌ |
| Gérer les utilisateurs | ✅ | ❌ | ❌ |
| Voir les recommandations | ❌ | ❌ | ✅ |

---

## 🚀 Lancement de l'application

### Backend

```bash
cd backend
npm install
# Configurer .env avec les paramètres Neo4j
npm start
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## 📝 Variables d'environnement (Backend)

```env
PORT=3000
NODE_ENV=development
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=7d
```

---

## 👥 Auteurs

Projet réalisé dans le cadre du cours **NoSQL & Big Data** - EMSI 2024-2025
