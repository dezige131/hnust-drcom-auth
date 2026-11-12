'use strict';
'require view';
'require form';
'require fs';

var AUTH_BIN = '/usr/bin/campus-auth';

/* Trim the trailing blank lines an exec reply usually carries. */
function tidy(text) {
	return (text || '').replace(/\r/g, '').replace(/[ \t]+$/gm, '').replace(/\s+$/, '');
}

function setStatus(node, text, color) {
	node.textContent = text;
	node.style.fontWeight = 'bold';
	node.style.color = color || '';
}

/* Read the end of the auth log and show it in the given <pre> node. */
function refreshLog(output) {
	output.textContent = '正在读取日志...';

	return fs.exec('/sbin/logread', [ '-e', 'campus-auth' ]).then(function(result) {
		if (result.code !== 0)
			throw new Error(result.stderr || 'logread failed');

		output.textContent = tidy(result.stdout) || '暂无认证日志';
	}).catch(function(error) {
		output.textContent = '读取日志失败：' + error.message;
	});
}

/* Run one authentication check and print everything it reports. */
function runCheck(button, status, output, logOutput) {
	function finish() {
		button.disabled = false;
		button.classList.remove('disabled');
	}

	button.disabled = true;
	button.classList.add('disabled');
	setStatus(status, '正在执行登录检查，请稍候...');
	output.textContent = '正在请求认证服务器...';

	return fs.exec(AUTH_BIN, [ 'check' ]).then(function(result) {
		var stdout = tidy(result.stdout);
		var stderr = tidy(result.stderr);
		var text = stdout;

		if (stderr.length > 0)
			text += (text.length > 0 ? '\n\n' : '') + stderr;

		output.textContent = text.length > 0 ? text : '（命令没有输出）';

		if (result.code === 0)
			setStatus(status, '检查完成：当前已经在线，或本次认证成功。', '#388e3c');
		else
			setStatus(status, '检查完成：本次认证没有成功（退出码 ' + result.code + '），原因见下方输出。', '#d32f2f');

		return refreshLog(logOutput);
	}, function(error) {
		output.textContent = '无法执行 ' + AUTH_BIN + '：' + error.message + '\n\n' +
			'如果提示权限不足，请确认插件是最新版本，并执行 /etc/init.d/rpcd restart 后刷新本页面。';
		setStatus(status, '执行失败。', '#d32f2f');
	}).then(finish, finish);
}

return view.extend({
	render: function() {
		var m = new form.Map('campus-auth', '校园网认证');
		var s = m.section(form.NamedSection, 'main', 'campus_auth', '认证设置');
		var o;

		s.addremove = false;

		o = s.option(form.Flag, 'enabled', '启用认证');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'boot_auth_enabled', '开机自动认证', '路由器启动并等待网络就绪后，自动执行一次认证。');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'student_id', '学号');
		o.rmempty = false;

		o = s.option(form.Value, 'password', '密码');
		o.password = true;
		o.rmempty = false;

		o = s.option(form.ListValue, 'login_method', '运营商');
		o.value('1', '电信');
		o.value('2', '移动');
		o.value('3', '联通');
		o.value('4', '校园网');
		o.default = '1';

		o = s.option(form.ListValue, 'terminal_type', '终端类型', '手机请求使用 2，电脑请求使用 1。');
		o.value('2', '手机');
		o.value('1', '电脑');
		o.default = '2';

		o = s.option(form.Value, 'interface', '认证网络接口', '用于读取当前 IPv4 地址，通常为 wan。');
		o.default = 'wan';
		o.rmempty = false;

		s = m.section(form.NamedSection, 'main', 'campus_auth', '每日检查时间');
		s.addremove = false;

		o = s.option(form.Flag, 'schedule_enabled', '启用每日检查');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'schedule_hour', '时（0–23）');
		o.datatype = 'range(0,23)';
		o.default = '3';
		o.rmempty = false;
		o.depends('schedule_enabled', '1');

		o = s.option(form.Value, 'schedule_minute', '分（0–59）');
		o.datatype = 'range(0,59)';
		o.default = '0';
		o.rmempty = false;
		o.depends('schedule_enabled', '1');

		return m.render().then(function(map) {
			var status = E('span', { 'style': 'display:block;margin-bottom:0.5em' }, '尚未检查。');
			var output = E('pre', {
				'style': 'max-height:22em;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere'
			}, '点击“立即检查认证”开始。');
			var logOutput = E('pre', {
				'style': 'max-height:22em;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere'
			}, '正在读取日志...');

			var checkButton = E('button', {
				'class': 'btn cbi-button cbi-button-action',
				'type': 'button',
				'click': function() {
					return runCheck(checkButton, status, output, logOutput);
				}
			}, '立即检查认证');

			var logButton = E('button', {
				'class': 'btn cbi-button',
				'type': 'button',
				'style': 'margin-left:0.5em',
				'click': function() {
					return refreshLog(logOutput);
				}
			}, '刷新日志');

			var check = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, '认证检查'),
				E('div', { 'class': 'cbi-section-descr' }, [
					'点击按钮会立即执行一次 campus-auth check，等同于在 SSH 中执行 ',
					E('code', {}, 'campus-auth check'),
					'。该操作使用已保存的配置，如果刚刚修改过设置，请先点击下方的“保存并应用”。'
				]),
				E('div', { 'style': 'margin:0.75em 0' }, [ checkButton, logButton ]),
				status,
				output,
				E('h3', { 'style': 'margin-top:1.5em' }, '认证日志'),
				logOutput
			]);

			refreshLog(logOutput);

			return E('div', {}, [ map, check ]);
		});
	}
});
