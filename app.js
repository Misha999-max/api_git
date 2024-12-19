// Основные DOM элементы
let searchInput
let autocompleteList
let repoList
let debounceTimeout
const addedRepos = new Set() // Хранение добавленных репозиториев для предотвращения дубликатов

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
	initializeApp()
})

// Инициализация приложения и установка обработчиков событий
function initializeApp() {
	searchInput = document.getElementById('searchInput')
	autocompleteList = document.getElementById('autocomplete')
	repoList = document.getElementById('repoList')

	searchInput.addEventListener('input', handleInput)
	searchInput.addEventListener('focus', showAutocomplete)
	document.addEventListener('click', handleClickOutside)
}

// Реализация debounce для предотвращения частых запросов к API
function debounce(func, delay) {
	return (...args) => {
		clearTimeout(debounceTimeout)
		debounceTimeout = setTimeout(() => func.apply(null, args), delay)
	}
}

// Поиск репозиториев через GitHub API
async function searchRepositories(query) {
	if (!query.trim()) {
		hideAutocomplete()
		return
	}

	try {
		const response = await fetch(
			`https://api.github.com/search/repositories?q=${encodeURIComponent(
				query
			)}&per_page=6`
		)

		if (!response.ok) {
			throw new Error('Ошибка запроса к GitHub API')
		}

		const data = await response.json()
		console.log(data)
		displayAutocompleteResults(data.items)
	} catch (error) {
		console.error('Ошибка при получении репозиториев:', error)
	}
}

// Отображение результатов автодополнения
function displayAutocompleteResults(repos) {
	autocompleteList.innerHTML = ''

	if (repos.length === 0) {
		hideAutocomplete()
		return
	}

	repos.forEach(repo => {
		if (!addedRepos.has(repo.id)) {
			const item = document.createElement('div')
			item.className = 'autocomplete-item'
			item.textContent = `${repo.full_name}`
			item.addEventListener('click', () => addRepository(repo))
			autocompleteList.appendChild(item)
		}
	})

	showAutocomplete()
}

// Добавление выбранного репозитория в список
function addRepository(repo) {
	if (addedRepos.has(repo.id)) {
		return
	}

	addedRepos.add(repo.id)

	const repoElement = document.createElement('div')
	repoElement.className = 'repo-item'
	repoElement.innerHTML = `
        <div class="repo-info">
            <div class="repo-name">Name: ${repo.full_name}</div>
            <div class="repo-details">
                by ${repo.owner.login}
                <span class="star-count">Star: ${repo.stargazers_count}</span>
            </div>
        </div>
        <button class="delete-btn">Удалить</button>
    `

	const deleteBtn = repoElement.querySelector('.delete-btn')
	deleteBtn.addEventListener('click', () => {
		addedRepos.delete(repo.id)
		repoElement.remove()
	})

	repoList.appendChild(repoElement)
	searchInput.value = ''
	hideAutocomplete()
}

// Обработка ввода в поле поиска
function handleInput(e) {
	const debouncedSearch = debounce(searchRepositories, 300)
	debouncedSearch(e.target.value)
}

// Показать список автодополнения
function showAutocomplete() {
	if (searchInput.value.trim()) {
		autocompleteList.style.display = 'block'
	}
}

// Скрыть список автодополнения
function hideAutocomplete() {
	autocompleteList.style.display = 'none'
}

// Обработка клика вне области поиска
function handleClickOutside(e) {
	if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
		hideAutocomplete()
	}
}
