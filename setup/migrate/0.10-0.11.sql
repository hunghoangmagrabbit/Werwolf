
ALTER TABLE <?php echo DB_PREFIX; ?>User
	ADD LastOnline INT UNSIGNED NOT NULL
		AFTER UserId;