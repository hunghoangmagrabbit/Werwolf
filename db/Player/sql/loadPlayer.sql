SELECT Game, User, Alive, ExtraWolfLive
FROM <?php echo DB_PREFIX; ?>Player
WHERE Game = <?php echo $game; ?> AND
	User = <?php echo $user; ?>;