# Spec Delta

## REMOVED Requirements

### Requirement: Texto estable para tecnologías de asistencia
**Reason**: El rediseño Evangelion eliminó el efecto glitch de todos los títulos. Testimonios era el último que lo usaba y lo retiró `acerca-testimonios-glass`. Ya no hay texto con caracteres revueltos que proteger.
**Migration**: Ninguna. Los títulos muestran su texto real de forma estática. El guard global de `sistema-visual` ("Sin restos de la estética anterior") impide que vuelva a entrar un componente o una animación de glitch.

### Requirement: Respeto del movimiento reducido
**Reason**: Sin el efecto glitch no queda animación de texto que suspender. El movimiento reducido del sitio lo sigue cubriendo el requisito "Movimiento reducido" de `sistema-visual`, junto con los de cada sección.
**Migration**: Ninguna. Las animaciones que quedan (revelado, arranque del hero, carrete 3D) ya respetan `prefers-reduced-motion` según sus propias specs.
