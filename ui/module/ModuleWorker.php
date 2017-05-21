<?php

include_once dirname(__FILE__).'/../../config.php';

class ModuleWorker {
	public static function prepairAllConfigs() {
		$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(
			dirname(__FILE__).'/config'));
		$it->rewind();
		while ($it->valid()) {
			if (!$it->isDot() && $it->isFile() && $it->getExtension() == 'json') {
				echo '<br/>setup '.$it->getFilename().' ...';
				ob_start();
				$result = self::prepairConfig($it->getBasename('.json'));
				$output = ob_get_contents();
				ob_end_clean();
				if ($result) echo ' ok.'.PHP_EOL;
				else echo ' error.'.PHP_EOL;
				echo $output;
			}
			$it->next();
		}
	}
	
	public static function prepairConfig($configFile) {
		// $data = json_decode(file_get_contents(
			// dirname(__FILE__).'/config/'.$configFile.'.json'), true);
		$analysedFiles = array(
			realpath(dirname(__FILE__).'/config/'.$configFile.'.json')
		);
		$data = self::getSetFiles($analysedFiles[0], $analysedFiles);
		$output = "";
		for ($i = 0; $i<count($data); $i++) {
			$path = dirname(__FILE__).'/../../'.$data[$i]["file"];
			$code = "";
			echo "<br/>- import ".$data[$i]["file"]." ...";
			if (is_file($path)) {
				ob_start();
				$worker = true;
				include $path;
				$code = ob_get_contents();
				ob_end_clean();
			}
			elseif (isset($data[$i]["required"]) && $data[$i]["required"])
				return null;
			if (isset($data[$i]["compress"])) {
				switch ($data[$i]["compress"]) {
					case "js": $code = self::compressJs($code); break;
					case "css": $code = self::compressCss($code); break;
				}
			}
			$output .= $code . PHP_EOL;
			echo " ok.";
		}
		if (!is_dir(dirname(__FILE__).'/cache'))
			mkdir(dirname(__FILE__).'/cache', 0777, true);
		file_put_contents(dirname(__FILE__).'/cache/'.$configFile.'.js',
			$output);
		return true;
	}
	
	private static function getSetFiles($setFile, &$analysedFiles) {
		$data = json_decode(file_get_contents($setFile), true);
		$list = array();
		for ($i = 0; $i<count($data); $i++) {
			if (isset($data[$i]["file"])) {
				$path = realpath(dirname(__FILE__).'/../../'.$data[$i]["file"]);
				if (is_file($path) && !in_array($data[$i]["file"], $list)) {
					$analysedFiles[] = $path;
					$list[] = $data[$i];
				}
			}
			elseif (isset($data[$i]["set"])) {
				$path = realpath(dirname(__FILE__).'/../../'.$data[$i]["set"]);
				if (is_file($path) && !in_array($path, $analysedFiles)) {
					$analysedFiles[] = $path;
					$l = self::getSetFiles($path, $analysedFiles);
					$list = array_merge($list, $l);
				}
			}
		}
		return $list;
	}
	
	private static function compressCss($buffer) {
		$buffer = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $buffer);
		$buffer = str_replace(': ', ':', $buffer);
		$buffer = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $buffer);
		return $buffer;
	}
	
	private static function compressJs($buffer) {
		// replace one line comments
		$buffer = preg_replace('/\/\/[^\r\n]*/', '', $buffer);
		// replace multi lime comments
		$buffer = preg_replace('/\/\*([^\*](?!\/))*\*\//', '', $buffer);
		// make it into one long line
		$buffer = str_replace(array("\n","\r"),'',$buffer);
		// replace all multiple spaces by one space
		$buffer = preg_replace('!\s+!',' ',$buffer);
		// replace some unneeded spaces, modify as needed
		$buffer = str_replace(array(' {',' }','{ ','; '),
			array('{','}','{',';'),$buffer);
		return $buffer;
	}
	
	public static function echoScripts($configFile) {
		if (RELEASE_MODE) {
			self::echoScriptPath('ui/module/cache/'.$configFile.'.js');
		}
		else {
			//$data = json_decode(file_get_contents(
			//	dirname(__FILE__).'/config/'.$configFile.'.json'), true);
			$analysedFiles = array(
				realpath(dirname(__FILE__).'/config/'.$configFile.'.json')
			);
			$data = self::getSetFiles($analysedFiles[0], $analysedFiles);
			for ($i = 0; $i<count($data); $i++) {
				$path = dirname(__FILE__).'/../../'.$data[$i]["file"];
				if (is_file($path)) {
					self::echoScriptPath($data[$i]["file"]);
				}
			}
		}
	}
	
	private static function echoScriptPath($path) {
		echo "\t".'<script type="application/javascript" src="/'.
			URI_PATH.$path.'"></script>'.PHP_EOL;
	}
}