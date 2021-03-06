CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Groups (
	Id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	Name TEXT NOT NULL,
	Created INT NOT NULL,
	LastGame INT NOT NULL,
	Leader INT UNSIGNED NOT NULL,
	CurrentGame INT UNSIGNED,
	EnterKey TEXT(12) NOT NULL,
	UNIQUE (EnterKey(12))
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>User (
	GroupId INT UNSIGNED NOT NULL,
	UserId INT UNSIGNED NOT NULL,
	LastOnline INT UNSIGNED NOT NULL,
	PRIMARY KEY (GroupId, UserId),
	FOREIGN KEY (GroupId) REFERENCES <?php echo DB_PREFIX; ?>Groups(Id)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Games (
	Id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	MainGroup INT UNSIGNED NOT NULL,
	Started INT NOT NULL,
	Finished INT,
	CurrentPhase VARCHAR(8) NOT NULL,
	CurrentLevel INT(8) NOT NULL,
	
	FOREIGN KEY (MainGroup) REFERENCES <?php echo DB_PREFIX; ?>Groups(Id)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

ALTER TABLE <?php echo DB_PREFIX; ?>Groups ADD CONSTRAINT
	FOREIGN KEY (CurrentGame) REFERENCES <?php echo DB_PREFIX; ?>Games(Id);

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Phases (
	Phase VARCHAR(8) NOT NULL,
	PhaseLevel INT(8) NOT NULL,
	NextPhase VARCHAR(8) NOT NULL,
	NextPhaseLevel INT(8) NOT NULL,
	PRIMARY KEY (Phase, PhaseLevel)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>ChatModeKeys (
	ChatMode VARCHAR(8) NOT NULL,
	PRIMARY KEY (ChatMode(8))
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>RoleModeKeys (
	RoleKey VARCHAR(8) NOT NULL,
	PRIMARY KEY (RoleKey(8))
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>ChatModes (
	ChatMode VARCHAR(8) NOT NULL,
	SupportedRoleKey VARCHAR(8) NOT NULL,
	EnableWrite BOOLEAN NOT NULL,
	Visible BOOLEAN NOT NULL,
	
	PRIMARY KEY (ChatMode(8), SupportedRoleKey(8)) -- ,
	-- CONSTRAINT FOREIGN KEY (ChatMode(8)) 
		-- REFERENCES <?php echo DB_PREFIX; ?>ChatModeKeys(ChatMode)
		-- ON DELETE CASCADE
		-- ON UPDATE CASCADE,
	-- CONSTRAINT FOREIGN KEY (SupportedRoleKey(8)) 
		-- REFERENCES <?php echo DB_PREFIX; ?>RoleModeKeys(RoleKey)
		-- ON DELETE CASCADE
		-- ON UPDATE CASCADE
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Player (
	Game INT UNSIGNED NOT NULL,
	User INT UNSIGNED NOT NULL,
	Alive BOOLEAN NOT NULL DEFAULT TRUE,
	ExtraWolfLive BOOLEAN NOT NULL DEFAULT FALSE,
	
	PRIMARY KEY (Game, User)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Roles (
	Game INT UNSIGNED NOT NULL,
	User INT UNSIGNED NOT NULL,
	RoleKey VARCHAR(8) NOT NULL,
	RoleIndex TINYINT UNSIGNED NOT NULL,
	
	
	PRIMARY KEY (Game, User, RoleKey(8)),
	FOREIGN KEY (Game, User) REFERENCES <?php echo DB_PREFIX; ?>Player(Game, User) -- ,
	-- FOREIGN KEY (RoleKey(8)) REFERENCES <?php echo DB_PREFIX; ?>RoleModeKeys(RoleKey)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Chats (
	Id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	Game INT UNSIGNED NOT NULL,
	ChatMode VARCHAR(8) NOT NULL,
	Opened BOOLEAN NOT NULL,
	EnableVoting BOOLEAN NOT NULL,
	
	UNIQUE (Game, ChatMode),
	FOREIGN KEY (Game) REFERENCES <?php echo DB_PREFIX; ?>Games(Id) -- ,
	-- FOREIGN KEY (ChatMode(8)) REFERENCES <?php echo DB_PREFIX; ?>ChatModeKeys(ChatMode)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>ChatLog (
	Id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	Chat INT UNSIGNED NOT NULL,
	User INT UNSIGNED NOT NULL,
	Message TEXT NOT NULL,
	SendDate INT UNSIGNED NOT NULL,
	
	FOREIGN KEY (Chat) REFERENCES <?php echo DB_PREFIX; ?>Chats(Id)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>VoteSetting (
	Chat INT UNSIGNED NOT NULL PRIMARY KEY,
	VoteStart INT NOT NULL,
	VoteEnd INT,
	ResultTarget INT UNSIGNED,
	
	FOREIGN KEY (Chat) REFERENCES <?php echo DB_PREFIX; ?>Chats(Id)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>Votes (
	Setting INT UNSIGNED NOT NULL,
	Voter INT UNSIGNED NOT NULL,
	Target INT UNSIGNED NOT NULL,
	VoteDate INT NOT NULL,
	
	PRIMARY KEY (Setting, Voter),
	FOREIGN KEY (Setting) REFERENCES <?php echo DB_PREFIX; ?>VoteSetting(Chat)
) CHARACTER SET latin1 COLLATE latin1_general_cs;

CREATE TABLE IF NOT EXISTS <?php echo DB_PREFIX; ?>VisibleRoles (
	Game INT UNSIGNED NOT NULL,
	MainUser INT UNSIGNED NOT NULL,
	TargetUser INT UNSIGNED NOT NULL,
	RoleKey VARCHAR(8) NOT NULL,
	
	PRIMARY KEY (Game, MainUser, TargetUser, RoleKey(8)),
	FOREIGN KEY (Game, MainUser) REFERENCES <?php echo DB_PREFIX; ?>Player(Game, User),
	FOREIGN KEY (Game, TargetUser) REFERENCES <?php echo DB_PREFIX; ?>Player(Game, User)
);
