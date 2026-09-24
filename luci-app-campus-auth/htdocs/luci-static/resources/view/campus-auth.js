'use strict';
'require view';
'require form';
'require fs';

function refreshLog(output) {
	output.textContent = '正在读取日志...';
	return fs.exec('/sbin/logread', [ '-e', 'campus-auth' ]).then(function(result) {
		if (result.code !== 0)
			throw new Error(result.stderr || 'logread failed');
		output.textContent = result.stdout.trim() || '暂无认证日志';
	}).catch(function(error) {
		output.textContent = '读取日志失败：' + error.message;
	});
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
			var output = E('pre', {
				'style': 'max-height:24em;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere'
			}, '正在读取日志...');
			var logs = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, '认证日志'),
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'type': 'button',
					'click': function() { return refreshLog(output); }
				}, '刷新日志'),
				output
			]);

			refreshLog(output);
			return E('div', {}, [ map, logs ]);
		});
	}
});
