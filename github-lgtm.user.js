// ==UserScript==
// @name           GitHub-LGTM
// @version        0.3
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
	var LGTM = document.getElementsByClassName('LGMT-count');
	if (LGTM.length == 1) {
	    LGTM[0].remove()
	}
	if (cpt != 0) {
	    var sidebar = document.getElementsByClassName('discussion-sidebar')[0];
	    var html = '<ul class="changes LGTM-count"><li><p>';
	    if (cpt > 0) {
		html += '<span class="addition">+</span>';
	    } else {
		html += '<span class="deletion">-</span>';
	    }
	    html += ' <strong>' + Math.abs(cpt) + ' LGTM</strong></p></li></ul>';
	    sidebar.insertAdjacentHTML('beforeend', html);
	    if (cpt > 0) {
		sidebar.lastChild.style.backgroundColor='#7FFF7F';
	    } else {
		sidebar.lastChild.style.backgroundColor='#FFAAAA';
	    }
	}
    }

    function update_merge_button()
    {
	var merge = document.getElementsByClassName('merge-branch')[0];
	if (merge.className.indexOf('mergeable-clean') != -1) {
	    merge.className = merge.className.replace('mergeable-clean', 'mergeable-unstable');

	    var bubble = merge.getElementsByClassName('bubble')[0];
	    bubble.insertAdjacentHTML('afterbegin', '<div class="branch-status edit-comment-hide status-failure"><p><span class="octicon octicon-x"></span> <strong>Failed</strong> — Need at least 2 LGTM</p></div>');

	    var button = bubble.getElementsByClassName('merge-branch-action')[0];
	    button.className = button.className.replace('primary', '');

	    var message = bubble.getElementsByClassName('merge-branch-heading')[0];
	    message.innerHTML = 'Merge with caution!';
	}
    }

    function update()
    {
	cpt=highlight_comments();
	update_lgmt_count(cpt);
	if (cpt < 2) {
	    update_merge_button();
	}
    }
    
    update();

    /* TODO: fix
    setTimeout(function(){
    var timeline = document.getElementsByClassName('discussion-timeline')
    timeline[0].addEventListener('DOMNodeInserted', function (e) {
	    var target = e.target;
	    var cl = target.className;
	     if (cl.IndexOf("comment-body") >= 0) {
		 update();
	    }
	}, false);
	}, 10);
    */
})();
