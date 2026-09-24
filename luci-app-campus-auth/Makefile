include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-campus-auth
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

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
	$(INSTALL_DIR) $(1)/usr/share/luci/model/cbi
	$(INSTALL_DATA) ./root/usr/share/luci/model/cbi/campus-auth.lua $(1)/usr/share/luci/model/cbi/
endef

$(eval $(call BuildPackage,luci-app-campus-auth))
