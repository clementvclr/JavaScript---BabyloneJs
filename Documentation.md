## Documentation

## Scenario du jeu

Initialement, notre jeu devait présenter une course entre deux personnages, où le joueur contrôlait l'un d'eux, tentant de fuir l'autre pour protéger sa flamme olympique. L'objectif était de maintenir la flamme intacte le plus longtemps possible pour accumuler des points, avec la menace constante d'être capturé par l'adversaire, ce qui réinitialisera la partie. Cependant, en raison de difficultés techniques rencontrées lors de l'implémentation de cet adversaire, le scénario du jeu a évolué vers un autre jeu.
Dans la version finale du jeu, le joueur se retrouve seul sur un circuit de course. Le défi est de compléter le parcours aussi rapidement que possible, tout en gérant son endurance. Le gameplay s'articule autour de la navigation via souris et clavier, avec le joueur qui doit suivre le tracé du parcours pour avancer. À chaque fin de course, le temps réalisé est comparé au précédent record. Si le joueur bat son meilleur temps, ce nouveau record est sauvegardé et affiché ; sinon, il a la possibilité de retenter sa chance autant de fois qu'il le souhaite pour améliorer sa performance.

# les Contrôles du Porteur de la flamme Olympique

* Z pour avancer (ou Q en clavier QWERTY)
* S pour reculer
* Maintient du clic gauche de la souris pour tourner la caméra et le personnages
* Maj (Shift) pour accélérer le personnages (cela consomme de l'endurance)

# Menu du jeu 

Le menu se compose uniquement du bouton Play pour être amené dans le jeu :

![MENU](https://github.com/Masnie1/Olympic-Adventure-Game/assets/91393594/4bb10805-96e2-4bce-8990-2e56679f0bde)

# Jeu

Dans notre jeu, il y a une ligne de départ, pour commencer le chronomètre de la course, et une ligne d'arrivée pour finir la course et stopper le chronomètre pour établir le temps à battre.

Ligne de départ :

![DEPART](https://github.com/Masnie1/Olympic-Adventure-Game/assets/91393594/da98d6d0-dd91-4232-9357-952421c04151)

Ligne d'arrivée :

![ARRIVE](https://github.com/Masnie1/Olympic-Adventure-Game/assets/91393594/9da4aba9-a44b-4c74-a584-70e27a015364)

# Mécanique

- L'endurance (situé en haut à droite de l'écran) est la ressource du porteur, qui se recharge sur le temps, pour accélérer avec le bouton Shift mais on ne pourras plus courir pendant quelques instant lorsque celle-ci est totalement épuisé par le joueur.
- 
![ENDURANCE](https://github.com/Masnie1/Olympic-Adventure-Game/assets/91393594/97380861-9ac1-40bf-9e68-f5930edc7a0b)

- Ligne de départ est un déclencheur permettant d'éffacer le temps actuel et de relancer le chronomètre.
- Ligne d'arrivée est un déclencheur permettant d'arreter le chronomètre et de remplacer le meilleur temps si il est meilleur.

![LIGNE](https://github.com/Masnie1/Olympic-Adventure-Game/assets/91393594/e7e36698-a987-4d53-8683-d94bb4a75d12)
