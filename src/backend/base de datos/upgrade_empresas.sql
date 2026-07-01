ALTER TABLE `empresas` ADD COLUMN IF NOT EXISTS `rut` VARCHAR(20) DEFAULT NULL AFTER `nombre`;
ALTER TABLE `empresas` ADD COLUMN IF NOT EXISTS `email` VARCHAR(100) DEFAULT NULL AFTER `rut`;
ALTER TABLE `empresas` ADD COLUMN IF NOT EXISTS `instagram` VARCHAR(100) DEFAULT NULL AFTER `email`;

INSERT INTO `empresas` (`id`, `nombre`, `rut`, `email`, `instagram`, `logo_url`, `tema_color`) VALUES
(1, 'J2 PUBLICIDAD SPA', '77.551.117-6', 'contacto@j2publicidad.com', NULL, 'Logfo j2 publicidad.jpeg', 'purple'),
(2, 'DWORK SPA', '78.083.174-K', 'dworkchile@gmail.com', NULL, NULL, 'slate'),
(3, 'Villy Car Spa', '78.263.871-8', 'contacto@villycartuning.com', 'villycar_tuning', 'Logo Villy Car.jpg', 'red'),
(4, 'Transportes y Turismos J2 SpA', '78.406.906-0', 'transportesyturismosj2@gmail.com', NULL, NULL, 'amber')
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`), `rut`=VALUES(`rut`), `email`=VALUES(`email`), `instagram`=VALUES(`instagram`), `logo_url`=VALUES(`logo_url`), `tema_color`=VALUES(`tema_color`);
