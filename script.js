// 유주와 영희할미 — 움직이는 기능 모음

// 1) 휴대폰 햄버거 메뉴
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('site-menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '메뉴 열기');
}));

// 2) 스크롤하면 스르륵 나타나기
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// 3) 맨 위로 가기 버튼
const toTop = document.getElementById('to-top');
window.addEventListener('scroll', () => {
  toTop.classList.toggle('show', window.scrollY > 500);
});
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// 4) 사진 갤러리 — 사진이 없으면 회색 자리, 누르면 크게 보기
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbCap = document.getElementById('lightbox-cap');
const lbFigure = lightbox.querySelector('figure');

document.querySelectorAll('.photo').forEach(photo => {
  const img = photo.querySelector('img');
  const markEmpty = () => photo.classList.add('is-empty');
  if (img.complete && img.naturalWidth === 0) markEmpty();
  img.addEventListener('error', markEmpty);

  photo.addEventListener('click', () => {
    const old = lbFigure.querySelector('.lightbox-empty');
    if (old) old.remove();
    if (photo.classList.contains('is-empty')) {
      lbImg.hidden = true;
      const box = document.createElement('div');
      box.className = 'lightbox-empty';
      box.textContent = '아직 사진이 없어요';
      lbFigure.prepend(box);
    } else {
      lbImg.hidden = false;
      lbImg.src = photo.dataset.src;
      lbImg.alt = photo.dataset.caption;
    }
    lbCap.textContent = photo.dataset.caption;
    lightbox.hidden = false;
    lightbox.querySelector('.lightbox-close').focus();
  });
});
function closeLightbox() { lightbox.hidden = true; }
lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

// 5) 이메일 주소 복사
const copyBtn = document.getElementById('copy-btn');
const copyMsg = document.getElementById('copy-msg');
copyBtn.addEventListener('click', async () => {
  const email = document.getElementById('email-text').textContent.trim();
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const t = document.createElement('textarea');
    t.value = email; document.body.appendChild(t); t.select();
    document.execCommand('copy'); t.remove();
  }
  copyMsg.textContent = '주소를 복사했어요! 메일 쓰는 곳에 붙여 넣으세요.';
  setTimeout(() => { copyMsg.textContent = ''; }, 3000);
});

// 6) 소식 게시판 — posts/list.json 의 글을 최신순으로
const listEl = document.getElementById('post-list');
const viewEl = document.getElementById('post-view');

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// 아주 간단한 글 변환: 빈 줄로 문단 나누기, **굵게**
function renderText(text) {
  return text.trim().split(/\n\s*\n/).map(p =>
    '<p>' + escapeHtml(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') + '</p>'
  ).join('');
}

async function loadBoard() {
  try {
    const res = await fetch('posts/list.json', { cache: 'no-store' });
    const posts = (await res.json()).sort((a, b) => b.date.localeCompare(a.date));
    if (!posts.length) {
      listEl.innerHTML = '<li><p class="board-empty">아직 글이 없어요.</p></li>';
      return;
    }
    listEl.innerHTML = '';
    posts.forEach(post => {
      const li = document.createElement('li');
      const isNotice = post.category === '공지';
      li.innerHTML = `<button type="button">
        <span class="post-tag ${isNotice ? 'notice' : ''}">${escapeHtml(post.category)}</span>
        <span class="post-name">${escapeHtml(post.title)}</span>
        <span class="post-date">${escapeHtml(post.date)}</span>
      </button>`;
      li.querySelector('button').addEventListener('click', () => openPost(post));
      listEl.appendChild(li);
    });
  } catch {
    listEl.innerHTML = '<li><p class="board-empty">글을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p></li>';
  }
}

async function openPost(post) {
  try {
    const res = await fetch('posts/' + post.file, { cache: 'no-store' });
    viewEl.querySelector('.post-body').innerHTML = renderText(await res.text());
  } catch {
    viewEl.querySelector('.post-body').innerHTML = '<p>글을 불러오지 못했어요.</p>';
  }
  viewEl.querySelector('.post-meta').textContent = `${post.category} · ${post.date}`;
  viewEl.querySelector('.post-title').textContent = post.title;
  listEl.hidden = true;
  viewEl.hidden = false;
  document.getElementById('news').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('back-to-list').addEventListener('click', () => {
  viewEl.hidden = true;
  listEl.hidden = false;
  document.getElementById('news').scrollIntoView({ behavior: 'smooth' });
});

loadBoard();
