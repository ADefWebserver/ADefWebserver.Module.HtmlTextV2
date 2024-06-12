if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

var resolveCallbacks = [];
var rejectCallbacks = [];
var htmlEditorRecognition;

window.HtmlEditor = {
    throttle: function (callback, delay) {
        var timeout = null;
        return function () {
            var args = arguments;
            var ctx = this;
            if (!timeout) {
                timeout = setTimeout(function () {
                    callback.apply(ctx, args);
                    timeout = null;
                }, delay);
            }
        };
    },
    mask: function (id, mask, pattern, characterPattern) {
      var el = document.getElementById(id);
      if (el) {
          var format = function (value, mask, pattern, characterPattern) {
              var chars = !characterPattern ? value.replace(new RegExp(pattern, "g"), "").split('') : value.match(new RegExp(characterPattern, "g"));
              var count = 0;

              var formatted = '';
              for (var i = 0; i < mask.length; i++) {
                  const c = mask[i];
                  if (chars && chars[count]) {
                      if (/\*/.test(c)) {
                          formatted += chars[count];
                          count++;
                      } else {
                          formatted += c;
                      }
                  }
              }
              return formatted;
          }

          var start = el.selectionStart != el.value.length ? el.selectionStart : -1;
          var end = el.selectionEnd != el.value.length ? el.selectionEnd : -1;

          el.value = format(el.value, mask, pattern, characterPattern);

          el.selectionStart = start != -1 ? start : el.selectionStart;
          el.selectionEnd = end != -1 ? end : el.selectionEnd;
      }
  },
  addContextMenu: function (id, ref) {
     var el = document.getElementById(id);
     if (el) {
        var handler = function (e) {
            e.stopPropagation();
            e.preventDefault();
            ref.invokeMethodAsync('HtmlEditorComponent.RaiseContextMenu',
                {
                    ClientX: e.clientX,
                    ClientY: e.clientY,
                    ScreenX: e.screenX,
                    ScreenY: e.screenY,
                    AltKey: e.altKey,
                    ShiftKey: e.shiftKey,
                    CtrlKey: e.ctrlKey,
                    MetaKey: e.metaKey,
                    Button: e.button,
                    Buttons: e.buttons,
                });
            return false;
        };
        HtmlEditor[id + 'contextmenu'] = handler;
        el.addEventListener('contextmenu', handler, false);
     }
  },
  addMouseEnter: function (id, ref) {
     var el = document.getElementById(id);
     if (el) {
        var handler = function (e) {
            ref.invokeMethodAsync('HtmlEditorComponent.RaiseMouseEnter');
        };
        HtmlEditor[id + 'mouseenter'] = handler;
        el.addEventListener('mouseenter', handler, false);
     }
  },
  addMouseLeave: function (id, ref) {
     var el = document.getElementById(id);
     if (el) {
        var handler = function (e) {
            ref.invokeMethodAsync('HtmlEditorComponent.RaiseMouseLeave');;
        };
        HtmlEditor[id + 'mouseleave'] = handler;
        el.addEventListener('mouseleave', handler, false);
     }
  },
  removeContextMenu: function (id) {
      var el = document.getElementById(id);
      if (el && HtmlEditor[id + 'contextmenu']) {
          el.removeEventListener('contextmenu', HtmlEditor[id + 'contextmenu']);
      }
  },
  removeMouseEnter: function (id) {
      var el = document.getElementById(id);
      if (el && HtmlEditor[id + 'mouseenter']) {
          el.removeEventListener('mouseenter', HtmlEditor[id + 'mouseenter']);
      }
  },
  removeMouseLeave: function (id) {
      var el = document.getElementById(id);
      if (el && HtmlEditor[id + 'mouseleave']) {
          el.removeEventListener('mouseleave', HtmlEditor[id + 'mouseleave']);
      }
  },
  adjustDataGridHeader: function (scrollableHeader, scrollableBody) {
    if (scrollableHeader && scrollableBody) {
      scrollableHeader.style.cssText =
        scrollableBody.clientHeight < scrollableBody.scrollHeight
          ? 'margin-left:0px;padding-right: ' +
            (scrollableBody.offsetWidth - scrollableBody.clientWidth) +
            'px'
          : 'margin-left:0px;';
    }
  },
  preventDefaultAndStopPropagation: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },
  preventArrows: function (el) {
    var preventDefault = function (e) {
      if (e.keyCode === 38 || e.keyCode === 40) {
        e.preventDefault();
        return false;
      }
    };
    if (el) {
       el.addEventListener('keydown', preventDefault, false);
    }
  },
  selectTab: function (id, index) {
    var el = document.getElementById(id);
    if (el && el.parentNode && el.parentNode.previousElementSibling) {
        var count = el.parentNode.children.length;
        for (var i = 0; i < count; i++) {
            var content = el.parentNode.children[i];
            if (content) {
                content.style.display = i == index ? '' : 'none';
            }
            var header = el.parentNode.previousElementSibling.children[i];
            if (header) {
                if (i == index) {
                    header.classList.add('rz-tabview-selected');
                    header.classList.add('rz-state-focused');
                }
                else {
                    header.classList.remove('rz-tabview-selected');
                    header.classList.remove('rz-state-focused');
                }
            }
        }
    }
  },
  loadGoogleMaps: function (defaultView, apiKey, resolve, reject) {
    resolveCallbacks.push(resolve);
    rejectCallbacks.push(reject);

    if (defaultView['rz_map_init']) {
      return;
    }

    defaultView['rz_map_init'] = function () {
      for (var i = 0; i < resolveCallbacks.length; i++) {
        resolveCallbacks[i](defaultView.google);
      }
    };

    var document = defaultView.document;
    var script = document.createElement('script');

    script.src =
      'https://maps.googleapis.com/maps/api/js?' +
      (apiKey ? 'key=' + apiKey + '&' : '') +
      'callback=rz_map_init';

    script.async = true;
    script.defer = true;
    script.onerror = function (err) {
      for (var i = 0; i < rejectCallbacks.length; i++) {
        rejectCallbacks[i](err);
      }
    };

    document.body.appendChild(script);
  },
  createMap: function (wrapper, ref, id, apiKey, zoom, center, markers, options, fitBoundsToMarkersOnUpdate) {
    var api = function () {
      var defaultView = document.defaultView;

      return new Promise(function (resolve, reject) {
        if (defaultView.google && defaultView.google.maps) {
          return resolve(defaultView.google);
        }

        HtmlEditor.loadGoogleMaps(defaultView, apiKey, resolve, reject);
      });
    };

    api().then(function (google) {
      HtmlEditor[id] = ref;
      HtmlEditor[id].google = google;

      HtmlEditor[id].instance = new google.maps.Map(wrapper, {
        center: center,
        zoom: zoom
      });

      HtmlEditor[id].instance.addListener('click', function (e) {
        HtmlEditor[id].invokeMethodAsync('HtmlEditorGoogleMap.OnMapClick', {
          Position: {Lat: e.latLng.lat(), Lng: e.latLng.lng()}
        });
      });

      HtmlEditor.updateMap(id, zoom, center, markers, options, fitBoundsToMarkersOnUpdate);
    });
  },
  updateMap: function (id, zoom, center, markers, options, fitBoundsToMarkersOnUpdate) {
    var api = function () {
        var defaultView = document.defaultView;

        return new Promise(function (resolve, reject) {
            if (defaultView.google && defaultView.google.maps) {
                return resolve(defaultView.google);
            }

            HtmlEditor.loadGoogleMaps(defaultView, apiKey, resolve, reject);
        });
    };
    api().then(function (google) {
        let markerBounds = new google.maps.LatLngBounds();

        if (HtmlEditor[id] && HtmlEditor[id].instance) {
            if (HtmlEditor[id].instance.markers && HtmlEditor[id].instance.markers.length) {
                for (var i = 0; i < HtmlEditor[id].instance.markers.length; i++) {
                    HtmlEditor[id].instance.markers[i].setMap(null);
                }
            }

            if (markers) {
                HtmlEditor[id].instance.markers = [];

                markers.forEach(function (m) {
                    var marker = new this.google.maps.Marker({
                        position: m.position,
                        title: m.title,
                        label: m.label
                    });

                    marker.addListener('click', function (e) {
                        HtmlEditor[id].invokeMethodAsync('HtmlEditorGoogleMap.OnMarkerClick', {
                            Title: marker.title,
                            Label: marker.label,
                            Position: marker.position
                        });
                    });

                    marker.setMap(HtmlEditor[id].instance);

                    HtmlEditor[id].instance.markers.push(marker);

                        markerBounds.extend(marker.position);
                });
            }

            if (zoom) {
                HtmlEditor[id].instance.setZoom(zoom);
                }

            if (center) {
                HtmlEditor[id].instance.setCenter(center);
            }

            if (options) {
                HtmlEditor[id].instance.setOptions(options);
            }

            if (markers && fitBoundsToMarkersOnUpdate) {
                HtmlEditor[id].instance.fitBounds(markerBounds);
            }
        }
    });
  },
  destroyMap: function (id) {
    if (HtmlEditor[id].instance) {
      delete HtmlEditor[id].instance;
    }
  },
 focusSecurityCode: function (el) {
    if (!el) return;
    var firstInput = el.querySelector('.html-editor-security-code-input');
    if (firstInput) {
        setTimeout(function () { firstInput.focus() }, 500);
    }
 },
  destroySecurityCode: function (id, el) {
    if (!HtmlEditor[id]) return;

    var inputs = el.getElementsByTagName('input');

    if (HtmlEditor[id].keyPress && HtmlEditor[id].paste) {
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].removeEventListener('keypress', HtmlEditor[id].keyPress);
            inputs[i].removeEventListener('keydown', HtmlEditor[id].keyDown);
            inputs[i].removeEventListener('paste', HtmlEditor[id].paste);
        }
        delete HtmlEditor[id].keyPress;
        delete HtmlEditor[id].paste;
    }

    HtmlEditor[id] = null;
  },
  createSecurityCode: function (id, ref, el, isNumber) {
      if (!el || !ref) return;

      var hidden = el.querySelector('input[type="hidden"]');
      var inputs = [...el.querySelectorAll('.html-editor-security-code-input')];

      HtmlEditor[id] = {};

      HtmlEditor[id].paste = function (e) {
          if (e.clipboardData) {
              var value = e.clipboardData.getData('text');

              if (value) {
                  for (var i = 0; i < value.length; i++) {
                      if (isNumber && isNaN(+value[i])) {
                          continue;
                      }
                      inputs[i].value = value[i];
                  }

                  var code = inputs.map(i => i.value).join('').trim();
                  hidden.value = code;

                  ref.invokeMethodAsync('HtmlEditorSecurityCode.OnValueChange', code);

                  inputs[inputs.length - 1].focus();
              }

              e.preventDefault();
          }
      }
      HtmlEditor[id].keyPress = function (e) {
          var keyCode = e.data ? e.data.charCodeAt(0) : e.which;
          var ch = e.data || String.fromCharCode(e.which);

          if (e.metaKey ||
              e.ctrlKey ||
              keyCode == 9 ||
              keyCode == 8 ||
              keyCode == 13
          ) {
              return;
          }

          if (isNumber && (keyCode < 48 || keyCode > 57)) {
              e.preventDefault();
              return;
          }

          if (e.currentTarget.value == ch) {
              return;
          }

          e.currentTarget.value = ch;

          var value = inputs.map(i => i.value).join('').trim();
          hidden.value = value;

          ref.invokeMethodAsync('HtmlEditorSecurityCode.OnValueChange', value);

          var index = inputs.indexOf(e.currentTarget);
          if (index < inputs.length - 1) {
              inputs[index + 1].focus();
          }
      }

      HtmlEditor[id].keyDown = function (e) {
          var keyCode = e.data ? e.data.charCodeAt(0) : e.which;
          if (keyCode == 8) {
              e.currentTarget.value = '';

              var value = inputs.map(i => i.value).join('').trim();
              hidden.value = value;

              ref.invokeMethodAsync('HtmlEditorSecurityCode.OnValueChange', value);

              var index = inputs.indexOf(e.currentTarget);
              if (index > 0) {
                  inputs[index - 1].focus();
              }
          }
      }

      for (var i = 0; i < inputs.length; i++) {
          inputs[i].addEventListener(navigator.userAgent.match(/Android/i) ? 'textInput' : 'keypress', HtmlEditor[id].keyPress);
          inputs[i].addEventListener(navigator.userAgent.match(/Android/i) ? 'textInput' : 'keydown', HtmlEditor[id].keyDown);
          inputs[i].addEventListener('paste', HtmlEditor[id].paste);
      }
  },
  createSlider: function (
    id,
    slider,
    parent,
    range,
    minHandle,
    maxHandle,
    min,
    max,
    value,
    step
  ) {
    HtmlEditor[id] = {};
    HtmlEditor[id].mouseMoveHandler = function (e) {
      if (!slider.canChange) return;
      e.preventDefault();
      var handle = slider.isMin ? minHandle : maxHandle;
      var offsetX =
        e.targetTouches && e.targetTouches[0]
          ? e.targetTouches[0].pageX - e.target.getBoundingClientRect().left
          : e.pageX - handle.getBoundingClientRect().left;
      var percent = (handle.offsetLeft + offsetX) / parent.offsetWidth;

      if (percent > 1) {
          percent = 1;
      } else if (percent < 0) {
          percent = 0;
      }

      var newValue = percent * (max - min) + min;

      if (
        slider.canChange &&
        newValue >= min &&
        newValue <= max
      ) {
        slider.invokeMethodAsync(
          'HtmlEditorSlider.OnValueChange',
          newValue,
          !!slider.isMin
        );
      }
    };

    HtmlEditor[id].mouseDownHandler = function (e) {
      if (parent.classList.contains('rz-state-disabled')) return;
      if (minHandle == e.target || maxHandle == e.target) {
        slider.canChange = true;
        slider.isMin = minHandle == e.target;
      } else {
        var offsetX =
          e.targetTouches && e.targetTouches[0]
            ? e.targetTouches[0].pageX - e.target.getBoundingClientRect().left
            : e.offsetX;
        var percent = offsetX / parent.offsetWidth;
        var newValue = percent * max;
        var oldValue = range ? value[slider.isMin ? 0 : 1] : value;
        if (newValue >= min && newValue <= max && newValue != oldValue) {
          slider.invokeMethodAsync(
            'HtmlEditorSlider.OnValueChange',
            newValue,
            !!slider.isMin
          );
        }
      }
    };

    HtmlEditor[id].mouseUpHandler = function (e) {
      slider.canChange = false;
    };

    document.addEventListener('mousemove', HtmlEditor[id].mouseMoveHandler);
    document.addEventListener('touchmove', HtmlEditor[id].mouseMoveHandler, {
      passive: false, capture: true
    });

    document.addEventListener('mouseup', HtmlEditor[id].mouseUpHandler);
    document.addEventListener('touchend', HtmlEditor[id].mouseUpHandler, {
      passive: true
    });

    parent.addEventListener('mousedown', HtmlEditor[id].mouseDownHandler);
    parent.addEventListener('touchstart', HtmlEditor[id].mouseDownHandler, {
      passive: true
    });
  },
  destroySlider: function (id, parent) {
    if (!HtmlEditor[id]) return;

    if (HtmlEditor[id].mouseMoveHandler) {
      document.removeEventListener('mousemove', HtmlEditor[id].mouseMoveHandler);
      document.removeEventListener('touchmove', HtmlEditor[id].mouseMoveHandler);
      delete HtmlEditor[id].mouseMoveHandler;
    }
    if (HtmlEditor[id].mouseUpHandler) {
      document.removeEventListener('mouseup', HtmlEditor[id].mouseUpHandler);
      document.removeEventListener('touchend', HtmlEditor[id].mouseUpHandler);
      delete HtmlEditor[id].mouseUpHandler;
    }
    if (HtmlEditor[id].mouseDownHandler) {
      parent.removeEventListener('mousedown', HtmlEditor[id].mouseDownHandler);
      parent.removeEventListener('touchstart', HtmlEditor[id].mouseDownHandler);
      delete HtmlEditor[id].mouseDownHandler;
    }

    HtmlEditor[id] = null;
  },
  prepareDrag: function (el) {
    if (el) {
        el.ondragover = function (e) { e.preventDefault(); };
        el.ondragstart = function (e) { e.dataTransfer.setData('', e.target.id); };
    }
  },
  focusElement: function (elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.focus();
    }
  },
  scrollIntoViewIfNeeded: function (ref, selector) {
    var el = selector ? ref.getElementsByClassName(selector)[0] : ref;
    if (el && el.scrollIntoViewIfNeeded) {
        el.scrollIntoViewIfNeeded();
    } else if (el && el.scrollIntoView) {
        el.scrollIntoView();
    }
  },
  selectListItem: function (input, ul, index) {
    if (!input || !ul) return;

    var childNodes = ul.getElementsByTagName('LI');

    var highlighted = ul.querySelectorAll('.html-editor-state-highlight');
    if (highlighted.length) {
      for (var i = 0; i < highlighted.length; i++) {
        highlighted[i].classList.remove('rz-state-highlight');
      }
    }

    ul.nextSelectedIndex = index;

    if (
      ul.nextSelectedIndex >= 0 &&
      ul.nextSelectedIndex <= childNodes.length - 1
    ) {
      childNodes[ul.nextSelectedIndex].classList.add('rz-state-highlight');
      childNodes[ul.nextSelectedIndex].scrollIntoView({block:'nearest'});
    }
  },
  focusListItem: function (input, ul, isDown, startIndex) {
    if (!input || !ul) return;
    var childNodes = ul.getElementsByTagName('LI');

    if (!childNodes || childNodes.length == 0) return;

    if (startIndex == undefined || startIndex == null) {
      startIndex = -1;
    }

    ul.nextSelectedIndex = startIndex;
    if (isDown) {
        while (ul.nextSelectedIndex < childNodes.length - 1) {
            ul.nextSelectedIndex++;
            if (!childNodes[ul.nextSelectedIndex].classList.contains('rz-state-disabled'))
                break;
        }
    } else {
        while (ul.nextSelectedIndex > 0) {
            ul.nextSelectedIndex--;
            if (!childNodes[ul.nextSelectedIndex].classList.contains('rz-state-disabled'))
                break;
        }
    }

    var highlighted = ul.querySelectorAll('.html-editor-state-highlight');
    if (highlighted.length) {
      for (var i = 0; i < highlighted.length; i++) {
        highlighted[i].classList.remove('rz-state-highlight');
      }
    }

    if (
      ul.nextSelectedIndex >= 0 &&
      ul.nextSelectedIndex <= childNodes.length - 1
    ) {
      childNodes[ul.nextSelectedIndex].classList.add('rz-state-highlight');
      HtmlEditor.scrollIntoViewIfNeeded(childNodes[ul.nextSelectedIndex]);
    }

    return ul.nextSelectedIndex;
  },
  clearFocusedHeaderCell: function (gridId) {
    var grid = document.getElementById(gridId);
    if (!grid) return;

    var table = grid.querySelector('.html-editor-grid-table');
    var thead = table.getElementsByTagName("thead")[0];
    var highlightedCells = thead.querySelectorAll('.html-editor-state-focused');
    if (highlightedCells.length) {
        for (var i = 0; i < highlightedCells.length; i++) {
            highlightedCells[i].classList.remove('rz-state-focused');
        }
    }
  },
  focusTableRow: function (gridId, key, rowIndex, cellIndex, isVirtual) {
    var grid = document.getElementById(gridId);
    if (!grid) return;

    var table = grid.querySelector('.html-editor-grid-table');
    var tbody = table.tBodies[0];
    var thead = table.tHead;

    var rows = (cellIndex != null && thead && thead.rows && thead.rows.length ? [...thead.rows] : []).concat(tbody && tbody.rows && tbody.rows.length ? [...tbody.rows] : []);

    if (isVirtual && (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown' || key == 'Home' || key == 'End')) {
        if (rowIndex == 0 && (key == 'End' || key == 'PageDown')) {
            var highlightedCells = thead.querySelectorAll('.html-editor-state-focused');
            if (highlightedCells.length) {
                for (var i = 0; i < highlightedCells.length; i++) {
                    highlightedCells[i].classList.remove('rz-state-focused');
                }
            }
        }
        if (key == 'ArrowUp' || key == 'ArrowDown' || key == 'PageUp' || key == 'PageDown') {
            var rowHeight = rows[rows.length - 1] ? rows[rows.length - 1].offsetHeight : 40;
            var factor = key == 'PageUp' || key == 'PageDown' ? 10 : 1;
            table.parentNode.scrollTop = table.parentNode.scrollTop + (factor * (key == 'ArrowDown' || key == 'PageDown' ? rowHeight : -rowHeight));
        }
        else {
            table.parentNode.scrollTop = key == 'Home' ? 0 : table.parentNode.scrollHeight;
        }
    }

    table.nextSelectedIndex = rowIndex || 0;
    table.nextSelectedCellIndex = cellIndex || 0;

    if (key == 'ArrowDown') {
        while (table.nextSelectedIndex < rows.length - 1) {
            table.nextSelectedIndex++;
            if (!rows[table.nextSelectedIndex].classList.contains('rz-state-disabled'))
                break;
        }
    } else if (key == 'ArrowUp') {
        while (table.nextSelectedIndex > 0) {
            table.nextSelectedIndex--;
            if (!rows[table.nextSelectedIndex].classList.contains('rz-state-disabled'))
                break;
        }
    } else if (key == 'ArrowRight') {
        while (table.nextSelectedCellIndex < rows[table.nextSelectedIndex].cells.length - 1) {
            table.nextSelectedCellIndex++;
            if (!rows[table.nextSelectedIndex].cells[table.nextSelectedCellIndex].classList.contains('rz-state-disabled'))
                break;
        }
    } else if (key == 'ArrowLeft') {
        while (table.nextSelectedCellIndex > 0) {
            table.nextSelectedCellIndex--;
            if (!rows[table.nextSelectedIndex].cells[table.nextSelectedCellIndex].classList.contains('rz-state-disabled'))
                break;
        }
    } else if (isVirtual && (key == 'PageDown' || key == 'End')) {
        table.nextSelectedIndex = rows.length - 1;
    } else if (isVirtual && (key == 'PageUp' || key == 'Home')) {
        table.nextSelectedIndex = 1;
    }

    if (key == 'ArrowLeft' || key == 'ArrowRight' || (key == 'ArrowUp' && table.nextSelectedIndex == 0 && table.parentNode.scrollTop == 0)) {
        var highlightedCells = rows[table.nextSelectedIndex].querySelectorAll('.html-editor-state-focused');
        if (highlightedCells.length) {
            for (var i = 0; i < highlightedCells.length; i++) {
                highlightedCells[i].classList.remove('rz-state-focused');
            }
        }

        if (
            table.nextSelectedCellIndex >= 0 &&
            table.nextSelectedCellIndex <= rows[table.nextSelectedIndex].cells.length - 1
        ) {
            var cell = rows[table.nextSelectedIndex].cells[table.nextSelectedCellIndex];

            if (!cell.classList.contains('rz-state-focused')) {
                cell.classList.add('rz-state-focused');
                if (!isVirtual && table.parentElement.scrollWidth > table.parentElement.clientWidth) {
                    HtmlEditor.scrollIntoViewIfNeeded(cell);
                }
            }
        }
    } else if (key == 'ArrowDown' || key == 'ArrowUp') {
        var highlighted = table.querySelectorAll('.html-editor-state-focused');
        if (highlighted.length) {
            for (var i = 0; i < highlighted.length; i++) {
                highlighted[i].classList.remove('rz-state-focused');
            }
        }

        if (table.nextSelectedIndex >= 0 &&
            table.nextSelectedIndex <= rows.length - 1
        ) {
            var row = rows[table.nextSelectedIndex];

            if (!row.classList.contains('rz-state-focused')) {
                row.classList.add('rz-state-focused');
                if (!isVirtual && table.parentElement.scrollHeight > table.parentElement.clientHeight) {
                    HtmlEditor.scrollIntoViewIfNeeded(row);
                }
            }
        }
    }

    return [table.nextSelectedIndex, table.nextSelectedCellIndex];
  },
  uploadInputChange: function (e, url, auto, multiple, clear, parameterName) {
      if (auto) {
          HtmlEditor.upload(e.target, url, multiple, clear, parameterName);
          e.target.value = '';
      } else {
          HtmlEditor.uploadChange(e.target);
      }
  },
  uploads: function (uploadComponent, id) {
    if (!HtmlEditor.uploadComponents) {
      HtmlEditor.uploadComponents = {};
    }
    HtmlEditor.uploadComponents[id] = uploadComponent;
  },
  uploadChange: function (fileInput) {
    var files = [];
    for (var i = 0; i < fileInput.files.length; i++) {
      var file = fileInput.files[i];
      files.push({
        Name: file.name,
        Size: file.size,
        Url: URL.createObjectURL(file)
      });
    }

    var uploadComponent =
      HtmlEditor.uploadComponents && HtmlEditor.uploadComponents[fileInput.id];
    if (uploadComponent) {
      if (uploadComponent.localFiles) {
        // Clear any previously created preview URL(s)
        for (var i = 0; i < uploadComponent.localFiles.length; i++) {
          var file = uploadComponent.localFiles[i];
          if (file.Url) {
            URL.revokeObjectURL(file.Url);
          }
        }
      }

      uploadComponent.files = Array.from(fileInput.files);
      uploadComponent.localFiles = files;
      uploadComponent.invokeMethodAsync('HtmlEditorUpload.OnChange', files);
    }

    for (var i = 0; i < fileInput.files.length; i++) {
      var file = fileInput.files[i];
      if (file.Url) {
        URL.revokeObjectURL(file.Url);
      }
    }
  },
  removeFileFromUpload: function (fileInput, name) {
    var uploadComponent = HtmlEditor.uploadComponents && HtmlEditor.uploadComponents[fileInput.id];
    if (!uploadComponent) return;
    var file = uploadComponent.files.find(function (f) { return f.name == name; })
    if (!file) { return; }
    var localFile = uploadComponent.localFiles.find(function (f) { return f.Name == name; });
    if (localFile) {
      URL.revokeObjectURL(localFile.Url);
    }
    var index = uploadComponent.files.indexOf(file)
    if (index != -1) {
        uploadComponent.files.splice(index, 1);
    }
    fileInput.value = '';
  },
  removeFileFromFileInput: function (fileInput) {
    fileInput.value = '';
  },
  upload: function (fileInput, url, multiple, clear, parameterName) {
    var uploadComponent = HtmlEditor.uploadComponents && HtmlEditor.uploadComponents[fileInput.id];
    if (!uploadComponent) { return; }
    if (!uploadComponent.files || clear) {
        uploadComponent.files = Array.from(fileInput.files);
    }
    var data = new FormData();
    var files = [];
    var cancelled = false;
    for (var i = 0; i < uploadComponent.files.length; i++) {
      var file = uploadComponent.files[i];
      data.append(parameterName || (multiple ? 'files' : 'file'), file, file.name);
      files.push({Name: file.name, Size: file.size});
    }
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        var uploadComponent =
          HtmlEditor.uploadComponents && HtmlEditor.uploadComponents[fileInput.id];
        if (uploadComponent) {
          var progress = parseInt((e.loaded / e.total) * 100);
          uploadComponent.invokeMethodAsync(
            'HtmlEditorUpload.OnProgress',
            progress,
            e.loaded,
            e.total,
            files,
            cancelled
          ).then(function (cancel) {
              if (cancel) {
                  cancelled = true;
                  xhr.abort();
              }
          });
        }
      }
    };
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        var status = xhr.status;
        var uploadComponent =
          HtmlEditor.uploadComponents && HtmlEditor.uploadComponents[fileInput.id];
        if (uploadComponent) {
          if (status === 0 || (status >= 200 && status < 400)) {
            uploadComponent.invokeMethodAsync(
              'HtmlEditorUpload.OnComplete',
                xhr.responseText,
                cancelled
            );
          } else {
            uploadComponent.invokeMethodAsync(
              'HtmlEditorUpload.OnError',
              xhr.responseText
            );
          }
        }
      }
    };
    uploadComponent.invokeMethodAsync('GetHeaders').then(function (headers) {
      xhr.open('POST', url, true);
      for (var name in headers) {
        xhr.setRequestHeader(name, headers[name]);
      }
      xhr.send(data);
    });
  },
  getCookie: function (name) {
    var value = '; ' + decodeURIComponent(document.cookie);
    var parts = value.split('; ' + name + '=');
    if (parts.length == 2) return parts.pop().split(';').shift();
  },
  getCulture: function () {
    var cultureCookie = HtmlEditor.getCookie('.AspNetCore.Culture');
    var uiCulture = cultureCookie
      ? cultureCookie.split('|').pop().split('=').pop()
      : null;
    return uiCulture || 'en-US';
  },
  numericOnPaste: function (e, min, max) {
    if (e.clipboardData) {
      var value = e.clipboardData.getData('text');

      if (value && !isNaN(+value)) {
        var numericValue = +value;
        if (min != null && numericValue >= min) {
            return;
        }
        if (max != null && numericValue <= max) {
            return;
        }
      }

      e.preventDefault();
    }
  },
  numericOnInput: function (e, min, max, isNullable) {
      var value = e.target.value;

      if (!isNullable && value == '' && min != null) {
          e.target.value = min;
      }

      if (value && !isNaN(+value)) {
        var numericValue = +value;
        if (min != null && !isNaN(+min) && numericValue < min) {
            e.target.value = min;
        }
        if (max != null && !isNaN(+max) && numericValue > max) {
            e.target.value = max;
        }
      }
  },
  numericKeyPress: function (e, isInteger, decimalSeparator) {
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.keyCode == 9 ||
      e.keyCode == 8 ||
      e.keyCode == 13
    ) {
      return;
      }

    if (e.code === 'NumpadDecimal') {
      e.target.value += decimalSeparator;
      e.preventDefault();
      return;
    }

    var ch = String.fromCharCode(e.charCode);

    if ((isInteger ? /^[-\d]$/ : /^[-\d,.]$/).test(ch)) {
      return;
    }

    e.preventDefault();
  },
  openContextMenu: function (x,y,id, instance, callback) {
    HtmlEditor.closePopup(id);

    HtmlEditor.openPopup(null, id, false, null, x, y, instance, callback);

    setTimeout(function () {
        var popup = document.getElementById(id);
        if (popup) {
            var menu = popup.querySelector('.html-editor-menu');
            if (menu) {
                menu.focus();
            }
        }
    }, 500);
  },
  openTooltip: function (target, id, delay, duration, position, closeTooltipOnDocumentClick, instance, callback) {
    HtmlEditor.closeTooltip(id);

    if (delay) {
        HtmlEditor[id + 'delay'] = setTimeout(HtmlEditor.openPopup, delay, target, id, false, position, null, null, instance, callback, closeTooltipOnDocumentClick);
    } else {
        HtmlEditor.openPopup(target, id, false, position, null, null, instance, callback, closeTooltipOnDocumentClick);
    }

    if (duration) {
      HtmlEditor[id + 'duration'] = setTimeout(HtmlEditor.closePopup, duration, id, instance, callback);
    }
  },
  closeTooltip(id) {
    HtmlEditor.closePopup(id);

    if (HtmlEditor[id + 'delay']) {
        clearTimeout(HtmlEditor[id + 'delay']);
    }

    if (HtmlEditor[id + 'duration']) {
        clearTimeout(HtmlEditor[id + 'duration']);
    }
  },
  destroyDatePicker(id) {
      var el = document.getElementById(id);
      if (!el) return;

      var button = el.querySelector('.html-editor-datepicker-trigger');
      if (button) {
          button.onclick = null;
      }
      var input = el.querySelector('.html-editor-inputtext');
      if (input) {
          input.onclick = null;
      }
  },
  createDatePicker(el, popupId) {
      if(!el) return;
      var handler = function (e, condition) {
          if (condition) {
              HtmlEditor.togglePopup(e.currentTarget.parentNode, popupId, false, null, null, true, false);
          }
      };

      var button = el.querySelector('.html-editor-datepicker-trigger');
      if (button) {
          button.onclick = function (e) {
              handler(e, !e.currentTarget.classList.contains('rz-state-disabled'));
          };
      }
      var input = el.querySelector('.html-editor-inputtext');
      if (input) {
          input.onclick = function (e) {
              handler(e, e.currentTarget.classList.contains('rz-readonly'));
          };
      }
  },
  findPopup: function (id) {
    var popups = [];
    for (var i = 0; i < document.body.children.length; i++) {
      if (document.body.children[i].id == id) {
        popups.push(document.body.children[i]);
      }
    }
    return popups;
  },
  repositionPopup: function (parent, id) {
      var popup = document.getElementById(id);
      if (!popup) return;

      var rect = popup.getBoundingClientRect();
      var parentRect = parent ? parent.getBoundingClientRect() : { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };

      if (/Edge/.test(navigator.userAgent)) {
          var scrollTop = document.body.scrollTop;
      } else {
          var scrollTop = document.documentElement.scrollTop;
      }

      var top = parentRect.bottom + scrollTop;

      if (top + rect.height > window.innerHeight && parentRect.top > rect.height) {
          top = parentRect.top - rect.height + scrollTop;
      }

      popup.style.top = top + 'px';
  },
  openPopup: function (parent, id, syncWidth, position, x, y, instance, callback, closeOnDocumentClick = true, autoFocusFirstElement = false) {
    var popup = document.getElementById(id);
    if (!popup) return;

    HtmlEditor.activeElement = document.activeElement;

    var parentRect = parent ? parent.getBoundingClientRect() : { top: y || 0, bottom: 0, left: x || 0, right: 0, width: 0, height: 0 };

    if (/Edge/.test(navigator.userAgent)) {
      var scrollLeft = document.body.scrollLeft;
      var scrollTop = document.body.scrollTop;
    } else {
      var scrollLeft = document.documentElement.scrollLeft;
      var scrollTop = document.documentElement.scrollTop;
    }

    var top = y ? y : parentRect.bottom;
    var left = x ? x : parentRect.left;

      if (syncWidth) {
        popup.style.width = parentRect.width + 'px';
        if (!popup.style.minWidth) {
            popup.minWidth = true;
            popup.style.minWidth = parentRect.width + 'px';
        }
    }

    if (window.chrome) {
        var closestFrozenCell = popup.closest('.html-editor-frozen-cell');
        if (closestFrozenCell) {
            HtmlEditor[id + 'FZL'] = { cell: closestFrozenCell, left: closestFrozenCell.style.left };
            closestFrozenCell.style.left = '';
        }
    }

    popup.style.display = 'block';

    var rect = popup.getBoundingClientRect();

    var smartPosition = !position || position == 'bottom';

    if (smartPosition && top + rect.height > window.innerHeight && parentRect.top > rect.height) {
      top = parentRect.top - rect.height;

      if (position) {
        top = top - 40;
        var tooltipContent = popup.children[0];
        var tooltipContentClassName = 'rz-' + position + '-tooltip-content';
        if (tooltipContent.classList.contains(tooltipContentClassName)) {
          tooltipContent.classList.remove(tooltipContentClassName);
          tooltipContent.classList.add('rz-top-tooltip-content');
        }
      }
    }

    if (smartPosition && left + rect.width > window.innerWidth && window.innerWidth > rect.width) {
      left = window.innerWidth - rect.width;

      if (position) {
        var tooltipContent = popup.children[0];
        var tooltipContentClassName = 'rz-' + position + '-tooltip-content';
        if (tooltipContent.classList.contains(tooltipContentClassName)) {
          tooltipContent.classList.remove(tooltipContentClassName);
          tooltipContent.classList.add('rz-left-tooltip-content');
          left = parentRect.left - rect.width - 5;
          top = parentRect.top - parentRect.height;
        }
      }
    }

    if (smartPosition) {
      if (position) {
        top = top + 20;
      }
    }

    if (position == 'left') {
      left = parentRect.left - rect.width - 5;
      top =  parentRect.top;
    }

    if (position == 'right') {
      left = parentRect.right + 10;
      top = parentRect.top;
    }

    if (position == 'top') {
      top = parentRect.top - rect.height + 5;
      left = parentRect.left;
    }

    popup.style.zIndex = 2000;
    popup.style.left = left + scrollLeft + 'px';
    popup.style.top = top + scrollTop + 'px';

    if (!popup.classList.contains('rz-overlaypanel')) {
        popup.classList.add('rz-popup');
    }

    HtmlEditor[id] = function (e) {
        var lastPopup = HtmlEditor.popups && HtmlEditor.popups[HtmlEditor.popups.length - 1];
        var currentPopup = lastPopup != null && document.getElementById(lastPopup.id) || popup;

        if (lastPopup) {
            currentPopup.instance = lastPopup.instance;
            currentPopup.callback = lastPopup.callback;
        }

        if(e.type == 'contextmenu' || !e.target || !closeOnDocumentClick) return;
        if (!/Android/i.test(navigator.userAgent) &&
            !['input', 'textarea'].includes(document.activeElement ? document.activeElement.tagName.toLowerCase() : '') && e.type == 'resize') {
            HtmlEditor.closePopup(currentPopup.id, currentPopup.instance, currentPopup.callback, e);
            return;
        }

        var closestLink = e.target.closest && (e.target.closest('.html-editor-link') || e.target.closest('.html-editor-navigation-item-link'));
        if (closestLink && closestLink.closest && closestLink.closest('a')) {
            if (HtmlEditor.closeAllPopups) {
                HtmlEditor.closeAllPopups();
            }
        }
        if (parent) {
          if (e.type == 'mousedown' && !parent.contains(e.target) && !currentPopup.contains(e.target)) {
              HtmlEditor.closePopup(currentPopup.id, currentPopup.instance, currentPopup.callback, e);
          }
        } else {
          if (!currentPopup.contains(e.target)) {
              HtmlEditor.closePopup(currentPopup.id, currentPopup.instance, currentPopup.callback, e);
          }
        }
    };

    if (!HtmlEditor.popups) {
        HtmlEditor.popups = [];
    }

    HtmlEditor.popups.push({ id, instance, callback });

    document.body.appendChild(popup);
    document.removeEventListener('mousedown', HtmlEditor[id]);
    document.addEventListener('mousedown', HtmlEditor[id]);
    window.removeEventListener('resize', HtmlEditor[id]);
    window.addEventListener('resize', HtmlEditor[id]);

    var p = parent;
    while (p && p != document.body) {
        if (p.scrollWidth > p.clientWidth || p.scrollHeight > p.clientHeight) {
            p.removeEventListener('scroll', HtmlEditor.closeAllPopups);
            p.addEventListener('scroll', HtmlEditor.closeAllPopups);
        }
        p = p.parentElement;
    }

    if (!parent) {
        document.removeEventListener('contextmenu', HtmlEditor[id]);
        document.addEventListener('contextmenu', HtmlEditor[id]);
    }

    if (autoFocusFirstElement) {
        setTimeout(function () {
            popup.removeEventListener('keydown', HtmlEditor.focusTrap);
            popup.addEventListener('keydown', HtmlEditor.focusTrap);

            var focusable = HtmlEditor.getFocusableElements(popup);
            var firstFocusable = focusable[0];
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 500);
    }
  },
  closeAllPopups: function (e, id) {
    if (!HtmlEditor.popups) return;
    var el = e && e.target || id && documentElement.getElementById(id);
    var popups = HtmlEditor.popups;
      for (var i = 0; i < popups.length; i++) {
        var p = popups[i];

        var closestPopup = el && el.closest && (el.closest('.html-editor-popup') || el.closest('.html-editor-overlaypanel'));
        if (closestPopup && closestPopup != p) {
            return;
        }

        HtmlEditor.closePopup(p.id, p.instance, p.callback, e);
    }
    HtmlEditor.popups = [];
  },
  closePopup: function (id, instance, callback, e) {
    var popup = document.getElementById(id);
    if (!popup) return;
    if (popup.style.display == 'none') {
        var popups = HtmlEditor.findPopup(id);
        if (popups.length > 1) {
            for (var i = 0; i < popups.length; i++) {
                if (popups[i].style.display == 'none') {
                    popups[i].parentNode.removeChild(popups[i]);
                } else {
                    popup = popups[i];
                }
            }
        } else {
            return;
        }
    }

    if (popup) {
      if (popup.minWidth) {
          popup.style.minWidth = '';
      }

      if (window.chrome && HtmlEditor[id + 'FZL']) {
        HtmlEditor[id + 'FZL'].cell.style.left = HtmlEditor[id + 'FZL'].left;
        HtmlEditor[id + 'FZL'] = null;
      }

      popup.style.display = 'none';
    }
    document.removeEventListener('mousedown', HtmlEditor[id]);
    window.removeEventListener('resize', HtmlEditor[id]);
    HtmlEditor[id] = null;

    if (instance) {
      instance.invokeMethodAsync(callback);
    }
    HtmlEditor.popups = (HtmlEditor.popups || []).filter(function (obj) {
        return obj.id !== id;
    });

    if (HtmlEditor.activeElement && HtmlEditor.activeElement == document.activeElement ||
        HtmlEditor.activeElement && document.activeElement == document.body ||
        HtmlEditor.activeElement && document.activeElement &&
            (document.activeElement.classList.contains('rz-dropdown-filter') || document.activeElement.classList.contains('rz-lookup-search-input'))) {
        setTimeout(function () {
            if (e && e.target && e.target.tabIndex != -1) {
                HtmlEditor.activeElement = e.target;
            }
            if (HtmlEditor.activeElement) {
               HtmlEditor.activeElement.focus();
            }
            HtmlEditor.activeElement = null;
        }, 100);
    }
  },
  popupOpened: function (id) {
    var popup = document.getElementById(id);
    if (popup) {
        return popup.style.display != 'none';
    }
    return false;
  },
  togglePopup: function (parent, id, syncWidth, instance, callback, closeOnDocumentClick = true, autoFocusFirstElement = false) {
    var popup = document.getElementById(id);
    if (!popup) return;
    if (popup.style.display == 'block') {
      HtmlEditor.closePopup(id, instance, callback);
    } else {
      HtmlEditor.openPopup(parent, id, syncWidth, null, null, null, instance, callback, closeOnDocumentClick, autoFocusFirstElement);
    }
  },
  destroyPopup: function (id) {
    var popup = document.getElementById(id);
    if (popup) {
      popup.parentNode.removeChild(popup);
    }
    document.removeEventListener('mousedown', HtmlEditor[id]);
  },
  scrollDataGrid: function (e) {
    var scrollLeft =
      (e.target.scrollLeft ? '-' + e.target.scrollLeft : 0) + 'px';

      e.target.previousElementSibling.style.marginLeft = scrollLeft;
      e.target.previousElementSibling.firstElementChild.style.paddingRight =
          e.target.clientHeight < e.target.scrollHeight ? (e.target.offsetWidth - e.target.clientWidth) + 'px' : '0px';

    if (e.target.nextElementSibling) {
        e.target.nextElementSibling.style.marginLeft = scrollLeft;
        e.target.nextElementSibling.firstElementChild.style.paddingRight =
            e.target.clientHeight < e.target.scrollHeight ? (e.target.offsetWidth - e.target.clientWidth) + 'px' : '0px';
    }

    for (var i = 0; i < document.body.children.length; i++) {
        if (document.body.children[i].classList.contains('rz-overlaypanel')) {
            document.body.children[i].style.display = 'none';
        }
    }
  },
  openDialog: function (options, dialogService, dialog) {
    if (HtmlEditor.closeAllPopups) {
        HtmlEditor.closeAllPopups();
    }
    HtmlEditor.dialogService = dialogService;
    if (
      document.documentElement.scrollHeight >
      document.documentElement.clientHeight
    ) {
      document.body.classList.add('no-scroll');
    }

    setTimeout(function () {
        var dialogs = document.querySelectorAll('.html-editor-dialog-content');
        if (dialogs.length == 0) return;
        var lastDialog = dialogs[dialogs.length - 1];

        if (lastDialog) {
            lastDialog.removeEventListener('keydown', HtmlEditor.focusTrap);
            lastDialog.addEventListener('keydown', HtmlEditor.focusTrap);

            if (options.resizable) {
                dialog.offsetWidth = lastDialog.parentElement.offsetWidth;
                dialog.offsetHeight = lastDialog.parentElement.offsetHeight;
                var dialogResize = function (e) {
                    if (!dialog) return;
                    if (dialog.offsetWidth != e[0].target.offsetWidth || dialog.offsetHeight != e[0].target.offsetHeight) {

                        dialog.offsetWidth = e[0].target.offsetWidth;
                        dialog.offsetHeight = e[0].target.offsetHeight;

                        dialog.invokeMethodAsync(
                            'HtmlEditorDialog.OnResize',
                            e[0].target.offsetWidth,
                            e[0].target.offsetHeight
                        );
                    }
                };
                HtmlEditor.dialogResizer = new ResizeObserver(dialogResize).observe(lastDialog.parentElement);
            }

            if (options.autoFocusFirstElement) {
                if (lastDialog.querySelectorAll('.html-editor-html-editor-content').length) {
                    var editable = lastDialog.querySelector('.html-editor-html-editor-content');
                    if (editable) {
                        var selection = window.getSelection();
                        var range = document.createRange();
                        range.setStart(editable, 0);
                        range.setEnd(editable, 0);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                } else {
                    var focusable = HtmlEditor.getFocusableElements(lastDialog);
                    var firstFocusable = focusable[0];
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                }
            }
        }
    }, 500);

    document.removeEventListener('keydown', HtmlEditor.closePopupOrDialog);
    if (options.closeDialogOnEsc) {
        document.addEventListener('keydown', HtmlEditor.closePopupOrDialog);
    }
  },
  closeDialog: function () {
    HtmlEditor.dialogResizer = null;
    document.body.classList.remove('no-scroll');
    var dialogs = document.querySelectorAll('.html-editor-dialog-content');
    if (dialogs.length <= 1) {
        document.removeEventListener('keydown', HtmlEditor.closePopupOrDialog);
        delete HtmlEditor.dialogService;
    }
  },
  disableKeydown: function (e) {
      e = e || window.event;
      e.preventDefault();
  },
  getFocusableElements: function (element) {
    return [...element.querySelectorAll('a, button, input, textarea, select, details, iframe, embed, object, summary dialog, audio[controls], video[controls], [contenteditable], [tabindex]')]
        .filter(el => el && el.tabIndex > -1 && !el.hasAttribute('disabled') && el.offsetParent !== null);
  },
  focusTrap: function (e) {
    e = e || window.event;
    var isTab = false;
    if ("key" in e) {
        isTab = (e.key === "Tab");
    } else {
        isTab = (e.keyCode === 9);
    }
    if (isTab) {
        var focusable = HtmlEditor.getFocusableElements(e.currentTarget);
        var firstFocusable = focusable[0];
        var lastFocusable = focusable[focusable.length - 1];

        if (firstFocusable && e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            firstFocusable.focus();
        } else if (lastFocusable && !e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            lastFocusable.focus();
        }
    }
  },
  closePopupOrDialog: function (e) {
      e = e || window.event;
      var isEscape = false;
      if ("key" in e) {
          isEscape = (e.key === "Escape" || e.key === "Esc");
      } else {
          isEscape = (e.keyCode === 27);
      }
      if (isEscape && HtmlEditor.dialogService) {
          var popups = document.querySelectorAll('.html-editor-popup,.html-editor-overlaypanel');
          for (var i = 0; i < popups.length; i++) {
              if (popups[i].style.display != 'none') {
                  return;
              }
          }

          HtmlEditor.dialogService.invokeMethodAsync('DialogService.Close', null);

          var dialogs = document.querySelectorAll('.html-editor-dialog-content');
          if (dialogs.length <= 1) {
              document.removeEventListener('keydown', HtmlEditor.closePopupOrDialog);
              delete HtmlEditor.dialogService;
              var layout = document.querySelector('.html-editor-layout');
              if (layout) {
                  layout.removeEventListener('keydown', HtmlEditor.disableKeydown);
              }
          }
      }
  },
  getInputValue: function (arg) {
    var input =
      arg instanceof Element || arg instanceof HTMLDocument
        ? arg
        : document.getElementById(arg);
    return input && input.value != '' ? input.value : null;
  },
  setInputValue: function (arg, value) {
    var input =
      arg instanceof Element || arg instanceof HTMLDocument
        ? arg
        : document.getElementById(arg);
    if (input) {
      input.value = value;
    }
  },
  readFileAsBase64: function (fileInput, maxFileSize, maxWidth, maxHeight) {
    var calculateWidthAndHeight = function (img) {
      var width = img.width;
      var height = img.height;
      // Change the resizing logic
      if (width > height) {
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }
      }
      return { width, height };
    };
    var readAsDataURL = function (fileInput) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onerror = function () {
          reader.abort();
          reject('Error reading file.');
        };
        reader.addEventListener(
          'load',
          function () {
            if (maxWidth > 0 && maxHeight > 0) {
              var img = document.createElement("img");
              img.onload = function (event) {
                // Dynamically create a canvas element
                var canvas = document.createElement("canvas");
                var res = calculateWidthAndHeight(img);
                canvas.width = res.width;
                canvas.height = res.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, res.width, res.height);
                resolve(canvas.toDataURL(fileInput.type));
              }
              img.src = reader.result;
            } else {
              resolve(reader.result);
            }
          },
          false
          );
        var file = fileInput.files[0];
        if (!file) return;
        if (file.size <= maxFileSize) {
          reader.readAsDataURL(file);
        } else {
          reject('File too large.');
        }
      });
    };

    return readAsDataURL(fileInput);
  },
  toggleMenuItem: function (target, event, defaultActive) {
    var item = target.closest('.html-editor-navigation-item');

    var active = defaultActive != undefined ? defaultActive : !item.classList.contains('rz-navigation-item-active');

    function toggle(active) {
      item.classList.toggle('rz-navigation-item-active', active);

      target.classList.toggle('rz-navigation-item-wrapper-active', active);

      var children = item.querySelector('.html-editor-navigation-menu');

      if (children) {
        children.style.display = active ? '' : 'none';
      }

      var icon = item.querySelector('.html-editor-navigation-item-icon-children');

      if (icon) {
        var deg = active ? '180deg' : 0;
        icon.style.transform = 'rotate(' + deg + ')';
      }
    }

    toggle(active);

    document.removeEventListener('click', target.clickHandler);

    target.clickHandler = function (event) {
      if (item.contains(event.target)) {
        var child = event.target.closest('.html-editor-navigation-item');
        if (child && child.querySelector('.html-editor-navigation-menu')) {
          return;
        }
      }
      toggle(false);
    }

    document.addEventListener('click', target.clickHandler);
  },
  destroyChart: function (ref) {
    ref.removeEventListener('mouseleave', ref.mouseLeaveHandler);
    delete ref.mouseLeaveHandler;
    ref.removeEventListener('mouseenter', ref.mouseEnterHandler);
    delete ref.mouseEnterHandler;
    ref.removeEventListener('mousemove', ref.mouseMoveHandler);
    delete ref.mouseMoveHandler;
    ref.removeEventListener('click', ref.clickHandler);
    delete ref.clickHandler;
    this.destroyResizable(ref);
  },
  destroyGauge: function (ref) {
    this.destroyResizable(ref);
  },
  destroyResizable: function (ref) {
    if (ref.resizeObserver) {
      ref.resizeObserver.disconnect();
      delete ref.resizeObserver;
    }
    if (ref.resizeHandler) {
      window.removeEventListener('resize', ref.resizeHandler);
      delete ref.resizeHandler;
    }
  },
  createResizable: function (ref, instance) {
    ref.resizeHandler = function () {
      var rect = ref.getBoundingClientRect();

      instance.invokeMethodAsync('Resize', rect.width, rect.height);
    };

    if (window.ResizeObserver) {
      ref.resizeObserver = new ResizeObserver(ref.resizeHandler);
      ref.resizeObserver.observe(ref);
    } else {
      window.addEventListener('resize', ref.resizeHandler);
    }

    var rect = ref.getBoundingClientRect();

    return {width: rect.width, height: rect.height};
  },
  createChart: function (ref, instance) {
    var inside = false;
    ref.mouseMoveHandler = this.throttle(function (e) {
      if (inside) {
        if (e.target.matches('.html-editor-chart-tooltip-content') || e.target.closest('.html-editor-chart-tooltip-content')) {
            return
        }
        var rect = ref.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        instance.invokeMethodAsync('MouseMove', x, y);
     }
    }, 100);
    ref.mouseEnterHandler = function () {
        inside = true;
    };
    ref.mouseLeaveHandler = function () {
        inside = false;
        instance.invokeMethodAsync('MouseMove', -1, -1);
    };
    ref.clickHandler = function (e) {
      var rect = ref.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      if (!e.target.closest('.html-editor-marker')) {
        instance.invokeMethodAsync('Click', x, y);
      }
    };

    ref.addEventListener('mouseenter', ref.mouseEnterHandler);
    ref.addEventListener('mouseleave', ref.mouseLeaveHandler);
    ref.addEventListener('mousemove', ref.mouseMoveHandler);
    ref.addEventListener('click', ref.clickHandler);

    return this.createResizable(ref, instance);
  },
  createGauge: function (ref, instance) {
    return this.createResizable(ref, instance);
  },
  destroyScheduler: function (ref) {
    if (ref.resizeHandler) {
      window.removeEventListener('resize', ref.resizeHandler);
      delete ref.resizeHandler;
    }
  },
  createScheduler: function (ref, instance) {
    ref.resizeHandler = function () {
      var rect = ref.getBoundingClientRect();

      instance.invokeMethodAsync('Resize', rect.width, rect.height);
    };

    window.addEventListener('resize', ref.resizeHandler);

    var rect = ref.getBoundingClientRect();
    return {width: rect.width, height: rect.height};
  },
  innerHTML: function (ref, value) {
    if (value != undefined) {
        if (ref != null) {
            ref.innerHTML = value;
        }
    } else {
      return ref.innerHTML;
    }
  },
  execCommand: function (ref, name, value) {
    if (document.activeElement != ref && ref) {
      ref.focus();
    }
    document.execCommand(name, false, value);
    return this.queryCommands(ref);
  },
  queryCommands: function (ref) {
    return {
      html: ref != null ? ref.innerHTML : null,
      fontName: document.queryCommandValue('fontName'),
      fontSize: document.queryCommandValue('fontSize'),
      formatBlock: document.queryCommandValue('formatBlock'),
      bold: document.queryCommandState('bold'),
      underline: document.queryCommandState('underline'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyFull: document.queryCommandState('justifyFull'),
      italic: document.queryCommandState('italic'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      superscript: document.queryCommandState('superscript'),
      subscript: document.queryCommandState('subscript'),
      unlink: document.queryCommandEnabled('unlink'),
      undo: document.queryCommandEnabled('undo'),
      redo: document.queryCommandEnabled('redo')
    };
  },
  mediaQueries: {},
  mediaQuery: function(query, instance) {
    if (instance) {
      function callback(event) {
          instance.invokeMethodAsync('OnChange', event.matches)
      };
      var query = matchMedia(query);
      this.mediaQueries[instance._id] = function() {
          query.removeListener(callback);
      }
      query.addListener(callback);
      return query.matches;
    } else {
        instance = query;
        if (this.mediaQueries[instance._id]) {
            this.mediaQueries[instance._id]();
            delete this.mediaQueries[instance._id];
        }
    }
  },
  createEditor: function (ref, uploadUrl, paste, instance, shortcuts) {
    ref.inputListener = function () {
      instance.invokeMethodAsync('OnChange', ref.innerHTML);
    };
    ref.keydownListener = function (e) {
      var key = '';
      if (e.ctrlKey || e.metaKey) {
        key += 'Ctrl+';
      }
      if (e.altKey) {
        key += 'Alt+';
      }
      if (e.shiftKey) {
        key += 'Shift+';
      }
      key += e.code.replace('Key', '').replace('Digit', '').replace('Numpad', '');

      if (shortcuts.includes(key)) {
        e.preventDefault();
        instance.invokeMethodAsync('ExecuteShortcutAsync', key);
      }
    };

    ref.clickListener = function (e) {
      if (e.target && e.target.matches('a,button')) {
        e.preventDefault();
      }
    }

    ref.selectionChangeListener = function () {
      if (document.activeElement == ref) {
        instance.invokeMethodAsync('OnSelectionChange');
      }
    };
    ref.pasteListener = function (e) {
      var item = e.clipboardData.items[0];

      if (item.kind == 'file') {
        e.preventDefault();
        var file = item.getAsFile();

        if (uploadUrl) {
            var xhr = new XMLHttpRequest();
            var data = new FormData();
            data.append("file", file);
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    var status = xhr.status;
                    if (status === 0 || (status >= 200 && status < 400)) {
                        var result = JSON.parse(xhr.responseText);
                        document.execCommand("insertHTML", false, '<img src="' + result.url + '">');
                    } else {
                        instance.invokeMethodAsync('OnError', xhr.responseText);
                    }
                }
            }
            instance.invokeMethodAsync('GetHeaders').then(function (headers) {
                xhr.open('POST', uploadUrl, true);
                for (var name in headers) {
                    xhr.setRequestHeader(name, headers[name]);
                }
                xhr.send(data);
            });
        } else {
            var reader = new FileReader();
            reader.onload = function (e) {
                document.execCommand("insertHTML", false, '<img src="' + e.target.result + '">');
            };
            reader.readAsDataURL(file);
        }
      } else if (paste) {
        e.preventDefault();
        var data = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');

        instance.invokeMethodAsync('OnPaste', data)
          .then(function (html) {
            document.execCommand("insertHTML", false, html);
          });
      }
    };
    ref.addEventListener('input', ref.inputListener);
    ref.addEventListener('paste', ref.pasteListener);
    ref.addEventListener('keydown', ref.keydownListener);
    ref.addEventListener('click', ref.clickListener);
    document.addEventListener('selectionchange', ref.selectionChangeListener);
    document.execCommand('styleWithCSS', false, true);
  },
  saveSelection: function (ref) {
    if (document.activeElement == ref) {
      var selection = getSelection();
      if (selection.rangeCount > 0) {
        ref.range = selection.getRangeAt(0);
      }
    }
  },
  restoreSelection: function (ref) {
    var range = ref.range;
    if (range) {
      delete ref.range;
      if(ref) {
          ref.focus();
      }
      var selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  },
  selectionAttributes: function (selector, attributes, container) {
    var selection = getSelection();
    var range = selection.rangeCount > 0 && selection.getRangeAt(0);
    var parent = range && range.commonAncestorContainer;
    var inside = false;
    while (parent) {
      if (parent == container) {
        inside = true;
        break;
      }
      parent = parent.parentNode;
    }
    if (!inside) {
      return {};
    }
    var target = selection.focusNode;
    var innerHTML;
    if (target) {
      if (target.nodeType == 3) {
        target = target.parentElement;
      } else {
        target = target.childNodes[selection.focusOffset];
        if (target) {
          innerHTML = target.outerHTML;
        }
      }
      if (target && target.matches && !target.matches(selector)) {
        target = target.closest(selector);
      }
    }
    return attributes.reduce(function (result, name) {
      if (target) {
        result[name] = target[name];
      }
      return result;
    }, { innerText: selection.toString(), innerHTML: innerHTML });
  },
  destroyEditor: function (ref) {
    if (ref) {
      ref.removeEventListener('input', ref.inputListener);
      ref.removeEventListener('paste', ref.pasteListener);
      ref.removeEventListener('keydown', ref.keydownListener);
      ref.removeEventListener('click', ref.clickListener);
      document.removeEventListener('selectionchange', ref.selectionChangeListener);
    }
  },
  startDrag: function (ref, instance, handler) {
    if (!ref) {
        return { left: 0, top: 0, width: 0, height: 0 };
    }
    ref.mouseMoveHandler = function (e) {
      instance.invokeMethodAsync(handler, { clientX: e.clientX, clientY: e.clientY });
    };
    ref.touchMoveHandler = function (e) {
      if (e.targetTouches[0] && ref.contains(e.targetTouches[0].target)) {
        instance.invokeMethodAsync(handler, { clientX: e.targetTouches[0].clientX, clientY: e.targetTouches[0].clientY });
      }
    };
    ref.mouseUpHandler = function (e) {
      HtmlEditor.endDrag(ref);
    };
    document.addEventListener('mousemove', ref.mouseMoveHandler);
    document.addEventListener('mouseup', ref.mouseUpHandler);
    document.addEventListener('touchmove', ref.touchMoveHandler, { passive: true, capture: true })
    document.addEventListener('touchend', ref.mouseUpHandler, { passive: true });
    return HtmlEditor.clientRect(ref);
  },
  submit: function (form) {
    form.submit();
  },
  clientRect: function (arg) {
    var el = arg instanceof Element || arg instanceof HTMLDocument
        ? arg
        : document.getElementById(arg);
    var rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  },
  endDrag: function (ref) {
    document.removeEventListener('mousemove', ref.mouseMoveHandler);
    document.removeEventListener('mouseup', ref.mouseUpHandler);
    document.removeEventListener('touchmove', ref.touchMoveHandler)
    document.removeEventListener('touchend', ref.mouseUpHandler);
  },
  startColumnReorder: function(id) {
      var el = document.getElementById(id + '-drag');
      var cell = el.parentNode.parentNode;
      var visual = document.createElement("th");
      visual.className = cell.className + ' rz-column-draggable';
      visual.style = cell.style;
      visual.style.display = 'none';
      visual.style.position = 'absolute';
      visual.style.height = cell.offsetHeight + 'px';
      visual.style.width = cell.offsetWidth + 'px';
      visual.style.zIndex = 2000;
      visual.innerHTML = cell.innerHTML;
      visual.id = id + 'visual';
      document.body.appendChild(visual);

      var resizers = cell.parentNode.querySelectorAll('.html-editor-column-resizer');
      for (let i = 0; i < resizers.length; i++) {
          resizers[i].style.display = 'none';
      }

      HtmlEditor[id + 'end'] = function (e) {
          var el = document.getElementById(id + 'visual');
          if (el) {
              document.body.removeChild(el);
              HtmlEditor[id + 'end'] = null;
              HtmlEditor[id + 'move'] = null;
              var resizers = cell.parentNode.querySelectorAll('.html-editor-column-resizer');
              for (let i = 0; i < resizers.length; i++) {
                  resizers[i].style.display = 'block';
              }
          }
      }
      document.removeEventListener('click', HtmlEditor[id + 'end']);
      document.addEventListener('click', HtmlEditor[id + 'end']);

      HtmlEditor[id + 'move'] = function (e) {
          var el = document.getElementById(id + 'visual');
          if (el) {
              el.style.display = 'block';

              if (/Edge/.test(navigator.userAgent)) {
                  var scrollLeft = document.body.scrollLeft;
                  var scrollTop = document.body.scrollTop;
              } else {
                  var scrollLeft = document.documentElement.scrollLeft;
                  var scrollTop = document.documentElement.scrollTop;
              }

              el.style.top = e.clientY + scrollTop + 10 + 'px';
              el.style.left = e.clientX + scrollLeft + 10 + 'px';
          }
      }
      document.removeEventListener('mousemove', HtmlEditor[id + 'move']);
      document.addEventListener('mousemove', HtmlEditor[id + 'move']);
  },
  stopColumnResize: function (id, grid, columnIndex) {
    var el = document.getElementById(id + '-resizer');
    if(!el) return;
    var cell = el.parentNode.parentNode;
    if (!cell) return;
    if (HtmlEditor[el]) {
        grid.invokeMethodAsync(
            'HtmlEditorGrid.OnColumnResized',
            columnIndex,
            cell.getBoundingClientRect().width
        );
        el.style.width = null;
        document.removeEventListener('mousemove', HtmlEditor[el].mouseMoveHandler);
        document.removeEventListener('mouseup', HtmlEditor[el].mouseUpHandler);
        document.removeEventListener('touchmove', HtmlEditor[el].touchMoveHandler)
        document.removeEventListener('touchend', HtmlEditor[el].mouseUpHandler);
        HtmlEditor[el] = null;
    }
  },
  startColumnResize: function(id, grid, columnIndex, clientX) {
      var el = document.getElementById(id + '-resizer');
      var cell = el.parentNode.parentNode;
      var col = document.getElementById(id + '-col');
      var dataCol = document.getElementById(id + '-data-col');
      var footerCol = document.getElementById(id + '-footer-col');
      HtmlEditor[el] = {
          clientX: clientX,
          width: cell.getBoundingClientRect().width,
          mouseUpHandler: function (e) {
              if (HtmlEditor[el]) {
                  grid.invokeMethodAsync(
                      'HtmlEditorGrid.OnColumnResized',
                      columnIndex,
                      cell.getBoundingClientRect().width
                  );
                  el.style.width = null;
                  document.removeEventListener('mousemove', HtmlEditor[el].mouseMoveHandler);
                  document.removeEventListener('mouseup', HtmlEditor[el].mouseUpHandler);
                  document.removeEventListener('touchmove', HtmlEditor[el].touchMoveHandler)
                  document.removeEventListener('touchend', HtmlEditor[el].mouseUpHandler);
                  HtmlEditor[el] = null;
              }
          },
          mouseMoveHandler: function (e) {
              if (HtmlEditor[el]) {
                  var widthFloat = (HtmlEditor[el].width - (HtmlEditor[el].clientX - e.clientX));
                  var minWidth = parseFloat(cell.style.minWidth || 0)

                  if (widthFloat < minWidth) {
                      widthFloat = minWidth;
                  }

                  var width = widthFloat + 'px';

                  if (cell) {
                      cell.style.width = width;
                  }
                  if (col) {
                      col.style.width = width;
                  }
                  if (dataCol) {
                      dataCol.style.width = width;
                  }
                  if (footerCol) {
                      footerCol.style.width = width;
                  }
              }
          },
          touchMoveHandler: function (e) {
              if (e.targetTouches[0]) {
                  HtmlEditor[el].mouseMoveHandler(e.targetTouches[0]);
              }
          }
      };
      el.style.width = "100%";
      document.addEventListener('mousemove', HtmlEditor[el].mouseMoveHandler);
      document.addEventListener('mouseup', HtmlEditor[el].mouseUpHandler);
      document.addEventListener('touchmove', HtmlEditor[el].touchMoveHandler, { passive: true })
      document.addEventListener('touchend', HtmlEditor[el].mouseUpHandler, { passive: true });
  },
      startSplitterResize: function(id,
        splitter,
        paneId,
        paneNextId,
        orientation,
        clientPos,
        minValue,
        maxValue,
        minNextValue,
        maxNextValue) {

        var el = document.getElementById(id);
        var pane = document.getElementById(paneId);
        var paneNext = document.getElementById(paneNextId);
        var paneLength;
        var paneNextLength;
        var panePerc;
        var paneNextPerc;
        var isHOrientation=orientation == 'Horizontal';

        var totalLength = 0.0;
        Array.from(el.children).forEach(element => {
            totalLength += isHOrientation
                ? element.getBoundingClientRect().width
                : element.getBoundingClientRect().height;
        });

        if (pane) {
            paneLength = isHOrientation
                ? pane.getBoundingClientRect().width
                : pane.getBoundingClientRect().height;

            panePerc = (paneLength / totalLength * 100) + '%';
        }

        if (paneNext) {
            paneNextLength = isHOrientation
                ? paneNext.getBoundingClientRect().width
                : paneNext.getBoundingClientRect().height;

            paneNextPerc = (paneNextLength / totalLength * 100) + '%';
        }

        function ensurevalue(value) {
            if (!value)
                return null;

            value=value.trim().toLowerCase();

            if (value.endsWith("%"))
                return totalLength*parseFloat(value)/100;

            if (value.endsWith("px"))
                return parseFloat(value);

            throw 'Invalid value';
        }

        minValue=ensurevalue(minValue);
        maxValue=ensurevalue(maxValue);
        minNextValue=ensurevalue(minNextValue);
        maxNextValue=ensurevalue(maxNextValue);

        HtmlEditor[el] = {
            clientPos: clientPos,
            panePerc: parseFloat(panePerc),
            paneNextPerc: isFinite(parseFloat(paneNextPerc)) ? parseFloat(paneNextPerc) : 0,
            paneLength: paneLength,
            paneNextLength: isFinite(paneNextLength) ? paneNextLength : 0,
            mouseUpHandler: function(e) {
                if (HtmlEditor[el]) {
                    splitter.invokeMethodAsync(
                        'HtmlEditorSplitter.OnPaneResized',
                        parseInt(pane.getAttribute('data-index')),
                        parseFloat(pane.style.flexBasis),
                        paneNext ? parseInt(paneNext.getAttribute('data-index')) : null,
                        paneNext ? parseFloat(paneNext.style.flexBasis) : null
                    );

                    document.removeEventListener('pointerup', HtmlEditor[el].mouseUpHandler);
                    document.removeEventListener('pointermove', HtmlEditor[el].mouseMoveHandler);
                    el.removeEventListener('touchmove', preventDefaultAndStopPropagation);
                    HtmlEditor[el] = null;
                }
            },
            mouseMoveHandler: function(e) {
                if (HtmlEditor[el]) {

                    splitter.invokeMethodAsync(
                        'HtmlEditorSplitter.OnPaneResizing'
                    );

                    var spacePerc = HtmlEditor[el].panePerc + HtmlEditor[el].paneNextPerc;
                    var spaceLength = HtmlEditor[el].paneLength + HtmlEditor[el].paneNextLength;

                    var length = (HtmlEditor[el].paneLength -
                        (HtmlEditor[el].clientPos - (isHOrientation ? e.clientX : e.clientY)));

                    if (length > spaceLength)
                        length = spaceLength;

                    if (minValue && length < minValue) length = minValue;
                    if (maxValue && length > maxValue) length = maxValue;

                    if (paneNext) {
                        var nextSpace=spaceLength-length;
                        if (minNextValue && nextSpace < minNextValue) length = spaceLength-minNextValue;
                        if (maxNextValue && nextSpace > maxNextValue) length = spaceLength+maxNextValue;
                    }

                    var perc = length / HtmlEditor[el].paneLength;
                    if (!isFinite(perc)) {
                        perc = 1;
                        HtmlEditor[el].panePerc = 0.1;
                        HtmlEditor[el].paneLength =isHOrientation
                            ? pane.getBoundingClientRect().width
                            : pane.getBoundingClientRect().height;
                    }

                    var newPerc =  HtmlEditor[el].panePerc * perc;
                    if (newPerc < 0) newPerc = 0;
                    if (newPerc > 100) newPerc = 100;

                    pane.style.flexBasis = newPerc + '%';
                    if (paneNext)
                        paneNext.style.flexBasis = (spacePerc - newPerc) + '%';
                }
            },
            touchMoveHandler: function(e) {
                if (e.targetTouches[0]) {
                    HtmlEditor[el].mouseMoveHandler(e.targetTouches[0]);
                }
            }
          };

        const preventDefaultAndStopPropagation = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
          document.addEventListener('pointerup', HtmlEditor[el].mouseUpHandler);
          document.addEventListener('pointermove', HtmlEditor[el].mouseMoveHandler);
          el.addEventListener('touchmove', preventDefaultAndStopPropagation, { passive: false });
    },
    resizeSplitter(id, e) {
        var el = document.getElementById(id);
        if (el && HtmlEditor[el]) {
            HtmlEditor[el].mouseMoveHandler(e);
            HtmlEditor[el].mouseUpHandler(e);
        }
    },
    openWaiting: function() {
        if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
            document.body.classList.add('no-scroll');
        }
        if (HtmlEditor.WaitingIntervalId != null) {
            clearInterval(HtmlEditor.WaitingIntervalId);
        }

        setTimeout(function() {
                var timerObj = document.getElementsByClassName('rz-waiting-timer');
                if (timerObj.length == 0) return;
                var timerStart = new Date().getTime();
                HtmlEditor.WaitingIntervalId = setInterval(function() {
                        if (timerObj == null || timerObj[0] == null) {
                            clearInterval(HtmlEditor.WaitingIntervalId);
                        } else {
                            var time = new Date(new Date().getTime() - timerStart);
                            timerObj[0].innerHTML = Math.floor(time / 1000) + "." + Math.floor((time % 1000) / 100);
                        }
                    },
                    100);
            },
            100);
    },
    closeWaiting: function() {
        document.body.classList.remove('no-scroll');
        if (HtmlEditor.WaitingIntervalId != null) {
            clearInterval(HtmlEditor.WaitingIntervalId);
            HtmlEditor.WaitingIntervalId = null;
        }
    },
    toggleDictation: function (componentRef, language) {
        function start() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                return;
            }

            htmlEditorRecognition = new SpeechRecognition();
            htmlEditorRecognition.componentRef = componentRef;
            htmlEditorRecognition.continuous = true;

            if (language) {
                htmlEditorRecognition.lang = language;
            }

            htmlEditorRecognition.onresult = function (event) {
                if (event.results.length < 1) {
                    return;
                }

                let current = event.results[event.results.length - 1][0]
                let result = current.transcript;

                componentRef.invokeMethodAsync("OnResult", result);
            };
            htmlEditorRecognition.onend = function (event) {
                componentRef.invokeMethodAsync("StopRecording");
                htmlEditorRecognition = null;
            };
            HtmlEditorRecognition.start();
        }

        if (htmlEditorRecognition) {
            if (htmlEditorRecognition.componentRef._id != componentRef._id) {
                htmlEditorRecognition.addEventListener('end', start);
            }
            htmlEditorRecognition.stop();
        } else {
            start();
        }
    }
};
