var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

var gWindowListener;

function browserWindowObserver(handlers) {
	this.handlers = handlers;
}

browserWindowObserver.prototype = {
	observe: function(aSubject, aTopic, aData) {
		if (aTopic == "domwindowopened") {
			aSubject.QueryInterface(Ci.nsIDOMWindow).addEventListener("load", this, false);
		} else if (aTopic == "domwindowclosed") {
			if (aSubject.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
				this.handlers.onShutdown(aSubject);
			}
		}
	},
	handleEvent: function(aEvent) {
		let aWindow = aEvent.currentTarget;
		aWindow.removeEventListener(aEvent.type, this, false);

		if (aWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
			this.handlers.onStartup(aWindow);
		}
	}
};

function onClickTabContainer(event) {
	if (event.which == 2 && event.target.tagName == 'tab' && Services.prefs.getBoolPref("browser.tabs.closeWindowWithLastTab")
		&& event.target.ownerDocument.defaultView.gBrowser.tabContainer.childNodes.length == 1) {
		event.target.ownerDocument.defaultView.gBrowser.removeTab(event.target, {animate: true, byMouse: true});
		event.stopPropagation();
	}
}

function browserWindowStartup(aWindow) {
	aWindow.gBrowser.mTabContainer.addEventListener('click', onClickTabContainer);
}

function browserWindowShutdown(aWindow) {
	aWindow.gBrowser.mTabContainer.removeEventListener('click', onClickTabContainer);
}

function startup(aData, aReason) {
	var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
	gWindowListener = new browserWindowObserver({
		onStartup: browserWindowStartup,
		onShutdown: browserWindowShutdown
	});
	ww.registerNotification(gWindowListener);
	
	var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
	var winenu = wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowStartup(winenu.getNext());
	}
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;

	var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
	ww.unregisterNotification(gWindowListener);
	gWindowListener = null;

	var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
	var winenu = wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowShutdown(winenu.getNext());
	}
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
