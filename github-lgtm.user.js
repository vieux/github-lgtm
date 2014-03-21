// ==UserScript==
// @name           GitHub-LGTM
// @version        0.5
// @namespace      http://vvieux.com
// @description    Display LGTM on github.com
// @match          https://github.com/
// @match          http://github.com/
// @include          https://github.com/*
// @include          http://github.com/*
// ==/UserScript==

(function() {

    function highlight_comment(text, comment)
    {
	var content = text.textContent || text.innerText;
	try {
	    if (String(content).toLowerCase().indexOf("not lgtm") != -1) {
		comment.style.backgroundColor='#FFAAAA';
		return -1
	    } else if (String(content).toLowerCase().indexOf("lgtm") != -1) {
		comment.style.backgroundColor='#7FFF7F';
		return 1
	    } 
        }catch (e) {}
	return 0
    }

    function highlight_comments()
    {
	var cpt = 0
	var comments = document.getElementsByClassName('comment-body');	
	for(var comment in comments){
	    if (comment == 0) {
		continue;
	    }
	    var com = comments[comment];
	    if (com.children && com.children.length > 0 && com.children[0].className.indexOf('email-fragment') >= 0) {
		cpt +=  highlight_comment(com.children[0], com);
	    } else {
		cpt += highlight_comment(com, com);
	    }
	}
	return cpt
    }

    function update_lgmt_count(cpt)
    {
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
		sidebar.firstChild.style.backgroundColor='#7FFF7F';
	    } else {
		sidebar.firstChild.style.backgroundColor='#FFAAAA';
	    }
	    sidebar.firstChild.style.textAlign="center";
	    sidebar.firstChild.style.borderRadius="3px";
	    sidebar.firstChild.style.MozBorderRadius="3px";
	}
    }

    function update_merge_button(cpt)
    {
	var merge = document.getElementsByClassName('merge-pr')[0];
	if (merge) {
	    if (merge.getElementsByClassName('push-more').length > 0) {
		merge = merge.firstElementChild.nextElementSibling;
	    } else {
		merge =merge.firstElementChild;
	    }

	    var message = merge.getElementsByClassName('merge-message')[0];

	    if (cpt < 2) {
		merge.className = merge.className.replace('branch-action-state-clean', 'branch-action-state-unstable');

		message.insertAdjacentHTML('beforebegin', '<div class="branch-status edit-comment-hide status-failure"><span class="octicon octicon-x"></span> <strong>Failed</strong> — Need at least 2 LGTM</div>');

		var button = message.getElementsByClassName('merge-branch-action')[0];
		button.className = button.className.replace('primary', '');

		var message = message.getElementsByClassName('merge-branch-heading')[0];
		message.innerHTML = 'Merge with caution!';
	    } else {
		message.insertAdjacentHTML('beforebegin', '<div class="branch-status edit-comment-hide status-success"><span class="octicon octicon-check"></span> <strong>All is well</strong> — ' + cpt + ' LGTM</div>');
	    }
	}
    }

    function add_lgtm_button()
    {
	var buttons = document.getElementById('js-new-comment-form-actions');
	button_lgtm = document.createElement('button');
	button_lgtm.setAttribute('class', 'button primary');
	button_lgtm.setAttribute('tabindex', '1');
	button_lgtm.innerText = 'LGTM';
	button_lgtm.onclick = function() {
	    for (var i = 0, len = document.getElementsByName('comment[body]').length; i < len; i++) {
		document.getElementsByName('comment[body]')[i].value = "LGTM";
	    }
	}
	buttons.appendChild(button_lgtm)
    }

    function update()
    {

	cpt=highlight_comments();
	update_lgmt_count(cpt);
	update_merge_button(cpt);
	add_lgtm_button();
    }

    if (document.getElementsByClassName('view-pull-request')[0]) {
	update();
    }

    /*
    setTimeout(function(){
	    var timeline = document.getElementsByClassName('js-discussion')[0];
	    if (timeline) {
		timeline.addEventListener('DOMNodeInserted', function (e) {
			var target = e.target;
			var cl = target.className;
			if (cl.IndexOf("js-comment-container") >= 0) {
			    update();
			}
		    }, false);
	    }
	}, 10);
    */
})();
