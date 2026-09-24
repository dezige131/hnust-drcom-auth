local sys = require "luci.sys"

m = Map("campus-auth", "校园网认证", "配置校园网 Portal 认证和每日自动检查。")
m.on_after_commit = function(self)
    sys.call("/etc/init.d/campus-auth reload >/dev/null 2>&1")
end

s = m:section(NamedSection, "main", "campus_auth", "认证设置")
s.addremove = false
s.anonymous = true

enabled = s:option(Flag, "enabled", "启用认证")
enabled.default = 1
enabled.rmempty = false

student = s:option(Value, "student_id", "学号")
student.datatype = "string"
student.rmempty = false

password = s:option(Value, "password", "密码")
password.password = true
password.rmempty = false

method = s:option(ListValue, "login_method", "运营商")
method:value("1", "电信")
method:value("2", "移动")
method:value("3", "联通")
method:value("4", "校园网")
method.default = "1"

iface = s:option(Value, "interface", "认证网络接口", "用于读取当前 DHCP IPv4 地址，通常为 wan。")
iface.default = "wan"
iface.rmempty = false

scheduled = s:option(Flag, "schedule_enabled", "启用每日检查")
scheduled.default = 1
scheduled.rmempty = false

hour = s:option(Value, "schedule_hour", "检查小时")
hour.datatype = "range(0,23)"
hour.default = "3"
hour.rmempty = false

minute = s:option(Value, "schedule_minute", "检查分钟")
minute.datatype = "range(0,59)"
minute.default = "0"
minute.rmempty = false

return m
