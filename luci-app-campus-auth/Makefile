include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-campus-auth
PKG_VERSION:=1.0.0
PKG_RELEASE:=5

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-campus-auth
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Campus network authentication
  DEPENDS:=+luci-base +jsonfilter +wget
endef

define Package/luci-app-campus-auth/description
  LuCI configuration and scheduled authentication for a campus portal.
endef

define Package/luci-app-campus-auth/conffiles
/etc/config/campus-auth
endef

define Build/Compile
endef

define Package/luci-app-campus-auth/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/campus-auth $(1)/etc/config/campus-auth
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/campus-auth $(1)/etc/init.d/campus-auth
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/campus-auth $(1)/usr/bin/campus-auth
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-campus-auth.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-campus-auth.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/campus-auth.js $(1)/www/luci-static/resources/view/
endef

define Package/luci-app-campus-auth/postinst
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] || {
	/etc/init.d/campus-auth enable
	/etc/init.d/campus-auth reload
	/etc/init.d/rpcd restart
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-campus-auth))
