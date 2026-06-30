function createHeart() {
  const heart = document.createElement('div');
  heart.classList.add('heart');
  
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.animationDuration = Math.random() * 2 + 3 + "s";
  
  heart.innerText = '💗';
  
  document.body.appendChild(heart);
  
  setTimeout(() => {
              heart.remove();
              }, 5000);
}

setInterval(createHeart, 300);

const birthDate = new Date(2010, 2, 21, 7, 30, 0);
const ageElement = document.getElementById('age');

function updateAge() {
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let lastBirthday = new Date(
    now.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
    birthDate.getHours(),
    birthDate.getMinutes(),
    birthDate.getSeconds()
  );

  if (now < lastBirthday) {
    years--;
    lastBirthday.setFullYear(now.getFullYear() - 1);
  }

  let remainingMilliseconds = now - lastBirthday;
  const days = Math.floor(remainingMilliseconds / 86400000);
  remainingMilliseconds %= 86400000;
  const hours = Math.floor(remainingMilliseconds / 3600000);
  remainingMilliseconds %= 3600000;
  const minutes = Math.floor(remainingMilliseconds / 60000);
  const seconds = Math.floor((remainingMilliseconds % 60000) / 1000);

  ageElement.textContent =
    `${years} years, ${days} days, ${hours} hours, ` +
    `${minutes} minutes, ${seconds} seconds`;
}

updateAge();
setInterval(updateAge, 1000);
