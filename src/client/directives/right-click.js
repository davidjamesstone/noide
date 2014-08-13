app.directive('ngRightClick', function($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(e) {
      scope.$apply(function() {
        e.preventDefault();
        e.stopPropagation();
        fn(scope, {
          $event: e
        });
        return false;
      });
    });
  };
});
