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
                if (com == null) {
                    continue;
                }

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

                // Remove old messages
                var lgtm_msg_id = 'lgtm-status';
                var prev_lgtm_msg = document.getElementById(lgtm_msg_id);
                if (prev_lgtm_msg) {
                    prev_lgtm_msg.parentNode.removeChild(prev_lgtm_msg);
                }

                var message = merge.getElementsByClassName('merge-message')[0];

                if (cpt < 2) {
                    merge.className = merge.className.replace('branch-action-state-clean', 'branch-action-state-unstable');

                    message.insertAdjacentHTML('beforebegin', '<div class="branch-status edit-comment-hide status-failure" id="' + lgtm_msg_id + '"><span class="status-description"><span class="octicon octicon-x text-failure"></span> <span class="text-muted"><strong class="text-failure">Failed</strong> — Need at least 2 LGTM</span></span></div>');

                    var button = message.getElementsByClassName('merge-branch-action')[0];
                    if (button == null) {
                        // In pull requests where the user doesn't have perms to merge, this button won't exist.
                        // The message is "this pull reuest can be merged by project collaborators". That's fine, just leave it.
                        return;
                    }
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
                    message.insertAdjacentHTML('beforebegin', '<div class="branch-status edit-comment-hide status-success" id="' + lgtm_msg_id + '"><span class="status-description"><span class="octicon octicon-check text-success"></span> <span class="text-muted"><strong class="text-success">All is well</strong> — ' + cpt + ' LGTM <span class="divider">·</span>' + names + '</span></span></div>');
                }
            }
        }

        function add_lgtm_button() {
            // Don't add our button twice
            if (document.getElementById('lgtm-button')) {
                return;
            }

            var buttons = document.getElementById('partial-new-comment-form-actions');
            button_lgtm = document.createElement('button');
            button_lgtm.setAttribute('class', 'btn btn-primary');
            button_lgtm.setAttribute('tabindex', '1');
            button_lgtm.innerText = 'LGTM';
            button_lgtm.textContent = 'LGTM';
            button_lgtm.id = 'lgtm-button';
            button_lgtm.onclick = function () {
                for (var i = 0, len = document.getElementsByName('comment[body]').length; i < len; i++) {
                    document.getElementsByName('comment[body]')[i].value = "LGTM";
                }
            };

            var close_button = $('[name=comment_and_close]', buttons);
            if (close_button.length > 0) {
                close_button = close_button[0];
                buttons.insertBefore(button_lgtm, close_button);
            } else {
                buttons.appendChild(button_lgtm)
            }
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

        // Place a method at the end of the event queue, using n iterations
        var queue_tail = function(meth, n) {
            var do_queue = function() {
                if (n--) {
                    setTimeout(do_queue, 0);
                } else {
                    meth();
                }
            };

            do_queue();
        };

        // When a link is clicked, it's loaded through AJAX, so we've gotta reprocess
        jQuery.ajaxSettings.xhr = function() {
            var xhr = new XMLHttpRequest;
            xhr.addEventListener('load', function() {
                if (this.status !== 200)
                    return;
                if (this.response.indexOf('pjax') === -1 && this.responseURL.indexOf('comment') === -1)
                    return;

                // We're the first listener, so we get called first. But we need GH to build its HTML first.
                queue_tail(update_if_necessary, 5);
            });

            return xhr;
        };

        // When a comment is deleted, we must detect when its DOM element is removed.
        // The HTML is removed long after the AJAX call to delete it occurs.
        var thread = document.getElementById('discussion_bucket');
        thread.addEventListener('DOMSubtreeModified', function(evt) {
            // Upon deletion, the inner div.comment is removed from the wrapper
            // Thus, when we get a subtree modified on the wrapper and it has no .comment, we're good.
            var target = jQuery(evt.target);
            if (target.is('.js-comment-container') && target.find('.comment').length == 0) {
                queue_tail(update_if_necessary, 1);
            }
        });
    };

    var inject = function() {
        var script = document.createElement('script');
        script.appendChild(document.createTextNode('(' + to_inject + ')();'));
        (document.body || document.head || document.documentElement).appendChild(script);
    };

    inject();
})();
