<?php

include_once dirname(__FILE__).'/../db.php';
include_once dirname(__FILE__).'/../JsonExport/JsonExport.php';

class User extends JsonExport {
	//group id
	public $group;
	//user id
	public $user;
	
	public function __construct($group, $user) {
		$this->jsonNames = array('group','user');
		$this->group = $group;
		$this->user = $user;
	}
	
	public static function loadAllUserByGroup($group) {
		$result = DB::executeFormatFile(
			dirname(__FILE__).'/sql/loadAllUserByGroup.sql',
			array(
				"group" => $group
			)
		);
		$list = array();
		$set = $result->getResult();
		while ($entry = $set->getEntry()) {
			$list[] = new User($entry["GroupId"], 
				intval($entry["UserId"]));
		}
		$result->free();
		return $list;
	}
	
	public static function loadAllGroupsByUser($user) {
		$result = DB::executeFormatFile(
			dirname(__FILE__).'/sql/loadAllGroupsByUser.sql',
			array(
				"user" => $user
			)
		);
		$list = array();
		echo DB::getError();
		$set = $result->getResult();
		while ($entry = $set->getEntry()) {
			$list[] = new User(intval($entry["GroupId"]), 
				intval($entry["UserId"]));
		}
		$result->free();
		return $list;
	}
	
	public static function createUser($group, $user) {
		// var_dump($user);
		// debug_print_backtrace();
		$result = DB::executeFormatFile(
			dirname(__FILE__).'/sql/addUser.sql',
			array(
				"group" => is_numeric($group) ? $group : $group->id,
				"user" => is_numeric($user) ? $user : $user->user
			)
		);
		if ($result) $result->free();
		return new User($group, $user);
	}
	
	public function remove() {
		$result = DB::executeFormatFile(
			dirname(__FILE__).'/sql/removeUser.sql',
			array(
				"group" => $this->group,
				"user" => $this->user
			)
		);
		$result->free();
	}
}