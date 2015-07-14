// ==UserScript==
// @name            GitHub-LGTM
// @version         0.6.4
// @namespace       http://vvieux.com
// @description     Display LGTM on github.com
// @match           https://github.com/
// @match           http://github.com/
// @include         https://github.com/*
// @include         http://github.com/*
// ==/UserScript==

(function () {
    var to_inject = function() {
        function highlight_comment(text, comment) {
            var content = text.textContent || text.innerText;
            try {
                if (String(content).toLowerCase().indexOf("lgtm?") != -1 ||
                    String(content).toLowerCase().indexOf("lgtm ?") != -1) {
                    return 0;
                } else if (String(content).toLowerCase().indexOf("not lgtm") != -1 ||
                    String(content).toLowerCase().indexOf("notlgtm") != -1 ||
                    String(content).toLowerCase().indexOf("no lgtm") != -1 ||
                    String(content).toLowerCase().indexOf("nolgtm") != -1) {
                    comment.style.backgroundColor = '#FFAAAA';
                    return -1;
                }
                else if (String(content).toLowerCase().indexOf("lgtm") != -1) {
                    comment.style.backgroundColor = '#7FFF7F';
                    return 1;
                }
            } catch (e) {
            }
            return 0;
        }

        function highlight_comments(votes) {
            var total = 0, cpt = 0;
            var comments = document.getElementsByClassName('timeline-comment-wrapper');
            var i = comments.length;
            while (--i) {
                var com = comments[i].getElementsByClassName('comment-body')[0];
                var author = comments[i].getElementsByClassName('author').length == 1 ? comments[i].getElementsByClassName('author')[0] : "<none>";
                if (!isNaN(votes[author]) && votes[author] != 0) {
                    continue;
                }
                if (com.children && com.children.length > 0 && com.children[0].className.indexOf('email-fragment') >= 0) {
                    cpt = highlight_comment(com.children[0], com);
                } else {
                    cpt = highlight_comment(com, com);
                }
                if (cpt != 0) {
                    votes[author] = cpt;
                }
                total += cpt;
            }
            return total;
        }

        function update_lgmt_count(cpt) {
            var LGTM = document.getElementsByClassName('sidebar-lgtm');
            if (LGTM.length == 1) {
                LGTM[0].remove()
            }
            if (cpt != 0) {
                var sidebar = document.getElementsByClassName('discussion-sidebar')[0];
                var html = '<div class="comment-body discussion-sidebar-heading sidebar-lgtm"><strong>';
                if (cpt > 0) {
                    html += '+';
                } else {
                    html += '-';
                }
                html += Math.abs(cpt) + ' LGTM</strong></div>';
                sidebar.insertAdjacentHTML('afterbegin', html);
                if (cpt > 0) {
                    sidebar.firstChild.style.backgroundColor = '#7FFF7F';
                } else {
                    sidebar.firstChild.style.backgroundColor = '#FFAAAA';
                }
                sidebar.firstChild.style.textAlign = "center";
                sidebar.firstChild.style.borderRadius = "3px";
                sidebar.firstChild.style.MozBorderRadius = "3px";
            }
        }

        function update_merge_button(cpt, votes) {
            var merge = document.getElementsByClassName('merge-pr')[0];
            if (merge) {
                if (merge.getElementsByClassName('merge-pr-more-commits').length > 0) {
                    merge = merge.firstElementChild.nextElementSibling;
                } else {
                    merge = merge.firstElementChild;
                }

                var message = merge.getElementsByClassName('merge-message')[0];

                if (cpt < 2) {
                    merge.className = merge.className.replace('branch-action-state-clean', 'branch-action-state-unstable');

                    message.insertAdjacentHTML('beforebegin', '<div class="branch-status edit-comment-hide status-failure"><span class="build-status-description"><span class="octicon octicon-x"></span> <strong>Failed</strong> — Need at least 2 LGTM</span></div>');

                    var button = message.getElementsByClassName('merge-branch-action')[0];
                    button.className = button.className.replace('primary', '');

                    message = message.getElementsByClassName('merge-branch-heading')[0];
                    message.innerHTML = 'Merge with caution!';
                } else {
                    var names = "";
                    for (var vote in votes) {
                        if (votes[vote] == 1) {
                            var parts = vote.split("/");
                            names = ' <a class="user-mention" href="' + vote + '">@' + parts[parts.length - 1] + '</a>' + names;
                        }
                    }
                    message.insertAdjacentHTML('beforebegin', '<div class="branch-status edit-comment-hide status-success"><span class="build-status-description"><span class="octicon octicon-check"></span> <strong>All is well</strong> — ' + cpt + ' LGTM <span class="divider">·</span>' + names + '</span></div>');
                }
            }
        }

        function add_lgtm_button() {
            var buttons = document.getElementById('partial-new-comment-form-actions');
            button_lgtm = document.createElement('button');
            button_lgtm.setAttribute('class', 'button primary');
            button_lgtm.setAttribute('tabindex', '1');
            button_lgtm.innerText = 'LGTM';
            button_lgtm.textContent = 'LGTM';
            button_lgtm.onclick = function () {
                for (var i = 0, len = document.getElementsByName('comment[body]').length; i < len; i++) {
                    document.getElementsByName('comment[body]')[i].value = "LGTM";
                }
            };
            buttons.insertBefore(button_lgtm, buttons.firstChild)
        }

        function remove_protip() {
            var protips = document.getElementsByClassName('form-actions-protip');
            if (protips.length > 0) {
                protips[0].remove();
            }
        }

        function update() {
            var votes = [];
            var cpt = highlight_comments(votes);
            update_lgmt_count(cpt);
            update_merge_button(cpt, votes);
            remove_protip();
            add_lgtm_button();
        }

        function update_if_necessary() {
            if (document.getElementsByClassName('view-pull-request')[0]) {
                update();
            }
        }

        // Run on page load
        update_if_necessary();

        // When a link is clicked, it's loaded through AJAX, so we've gotta reprocess
        jQuery.ajaxSettings.xhr = function() {
            var xhr = new XMLHttpRequest;
            xhr.addEventListener('load', function() {
                if (this.status !== 200)
                    return;
                if (this.response.indexOf('pjax') === -1)
                    return;

                // Because we're the first load listener to be called, wait till processing is complete
                setTimeout(function() {
                    update_if_necessary();
                }, 0);
            });

            return xhr;
        };
    };

    var inject = function() {
        var script = document.createElement('script');
        script.appendChild(document.createTextNode('(' + to_inject + ')();'));
        (document.body || document.head || document.documentElement).appendChild(script);
    };

    inject();
})();
