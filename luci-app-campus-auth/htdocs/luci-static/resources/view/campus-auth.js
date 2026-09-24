'use strict';
'require view';
'require form';
'require fs';
'require ui';

return view.extend({
	render: function() {
		var m = new form.Map('campus-auth', '校园网认证');
		var s = m.section(form.NamedSection, 'main', 'campus_auth', '认证设置');
		var o;

		s.addremove = false;

		o = s.option(form.Flag, 'enabled', '启用认证');
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

		o = s.option(form.Value, 'interface', '认证网络接口', '用于读取当前 IPv4 地址，通常为 wan。');
		o.default = 'wan';
		o.rmempty = false;

		o = s.option(form.Flag, 'schedule_enabled', '启用每日检查');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'schedule_hour', '检查小时');
		o.datatype = 'range(0,23)';
		o.default = '3';
		o.rmempty = false;

		o = s.option(form.Value, 'schedule_minute', '检查分钟');
		o.datatype = 'range(0,59)';
		o.default = '0';
		o.rmempty = false;

		return m.render();
	},

	handleSaveApply: function(ev) {
		return this.handleSave(ev).then(function() {
			return ui.changes.apply();
		}).then(function() {
			return fs.exec('/etc/init.d/campus-auth', [ 'reload' ]);
		}).then(function(result) {
			if (result.code !== 0)
				throw new Error('Failed to reload campus-auth: ' + result.stderr);
		});
	}
});
