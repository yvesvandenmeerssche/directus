define([
  "handlebars",
  "typetools",
  "plugins/backbone.layoutmanager",
  "plugins/bootstrap-dropdown",           //load anonomosly
  "plugins/bootstrap-typeahead"           //load anonomosly
],

function(Handlebars, typetools) {

  // Provide a global location to place configuration settings and module
  // creation.
  var app = {

    makeMediaUrl: function(mediaModel, thumbnail) {
      var storageAdapters = window.directusData.storage_adapters,
        adapterId,
        storageAdapter;
      if(thumbnail) {
        adapterId = 'THUMBNAIL';
        if(!storageAdapters.hasOwnProperty(adapterId)) {
          throw new Error("Cannot find default thumbnail storage_adapter using key: " + adapterId);
        }
      } else {
        adapterId = mediaModel.get('storage_adapter');
        if(!storageAdapters.hasOwnProperty(adapterId)) {
          throw new Error("Media record's storage_adapter FK value maps to an undefined directus_storage_adapters record: " + adapterId);
        }
      }
      storageAdapter = storageAdapters[adapterId];
      var url = storageAdapter.url + mediaModel.get('name');
      return url;
    },

    evaluateExpression: function(a, operator, b) {
      switch (operator) {
        case '==':
          return (a == b);
        case '===':
          return (a === b);
      }
    },

    getCurrentUser: function() {
       var authenticatedUser = window.directusData.authenticatedUser;
       var user = app.users.get(authenticatedUser.id);
       return user;
    },

    getCurrentGroup: function() {
      var user = app.getCurrentUser();
      return user.get('group');
    },

    deepClone: function(data) {
      return JSON.parse(JSON.stringify(data));
    },

    affix: function() {
      var sidebarOffset = $('.container-sidebar').offset();
      var navbarHeight = $('.navbar').height();
      var stickyHeight = parseInt(sidebarOffset.top,10) - parseInt(navbarHeight,10) - 20;
      var stuck = false;
      $(window).scroll(function(e){
        var scrollTop = $(window).scrollTop();
        if(!stuck && scrollTop >= stickyHeight){
          //console.log("stuck");
          stuck = true;
          $(".container-sidebar").addClass('affix-sidebar');
        } else if(stuck && scrollTop < stickyHeight){
          //console.log("unstuck");
          stuck = false;
          $(".container-sidebar").removeClass('affix-sidebar');
        }
      });
    },

    dateDaysFromNow: function(days) {
      var today = new Date();
      return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    },

    summarizeArray: function(array) {
      return _.reduce(array, function(memo, num){ return memo + parseInt(num,10); }, 0);
    },

  };

  app.sendFiles = function(files, callback) {
    var formData = new FormData();

    if (files instanceof File) files = [files];

    _.each(files, function(file, i) {
      formData.append('file'+i, file);
    });

    $.ajax({
      url: app.API_URL + 'upload',
      type: 'POST',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: callback,
      error: function(err1, err2, err3) {
        console.log('ERRRRRROOOORRR!!', err1, err2, err3);
      }
    });
  };

  // Agnus Croll:
  // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  Object.toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };


  //Give forms the ability to serialize to objects
  $.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });

    return o;
  };

  // Localize or create a new JavaScript Template object.
  var JST = window.JST = window.JST || {};

  // Configure LayoutManager with Backbone Boilerplate defaults.
  Backbone.Layout.configure({
    // Allow LayoutManager to augment Backbone.View.prototype.
    manage: true,

    prefix: "app/templates/",

    fetch: function(path) {
      // Concatenate the file extension.

      // If template is not a path but instead Handlebars.Compile
      if (typeof path === 'function') {
        return path;
      }

      path = path + ".html";

      // If cached, use the compiled template.
      if (JST[path]) {
        return JST[path];
      }

      // Put fetch into `async-mode`.
      var done = this.async();

      // Seek out the template asynchronously.
      // ASYNC is causing render-order trouble, use sync now since it will be compiled anyway

      //$.get(app.root + path, function(contents) {
      //  done(JST[path] = Handlebars.compile(contents));
      //});

      $.ajax({
        url: app.root + path,
        async: false,
        success: function(contents) {
          done(JST[path] = Handlebars.compile(contents));
        }
      });


    }
  });

  window.app = app;

  // Mix Backbone.Events, modules, typetools, and layout management into the app object.
  return _.extend(app, {
    // Create a custom object with a nested Views object.
    module: function(additionalProps) {
      return _.extend({ Views: {} }, additionalProps);
    },

    // Helper for using layouts.
    useLayout: function(options) {
      // Create a new Layout with options.
      var layout = new Backbone.Layout(_.extend({
        el: "body"
      }, options));

      // Cache the refererence.
      return this.layout = layout;
    }

  }, Backbone.Events, typetools);

});