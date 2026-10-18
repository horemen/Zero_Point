// Предметы, которые выпадают из врагов: по 4 на каждый тип врага. Цена — в коинах за штуку.
(function (ZP) {
  ZP.RARITY = [
    { name: 'Обычный',   color: '#f4e4bd', weight: 55 },
    { name: 'Необычный', color: '#9cf07a', weight: 28 },
    { name: 'Редкий',    color: '#7fc8ff', weight: 13 },
    { name: 'Ценный',    color: '#d8a0ff', weight: 4 },
  ];
  ZP.ITEMS = {
    // звери
    fur:     { cat: 'beast', rar: 0, name: 'Клок шерсти', price: 2,  desc: 'Мягкий и тёплый. Скорняки берут охотно.' },
    bone:    { cat: 'beast', rar: 1, name: 'Кость',       price: 4,  desc: 'Крепкая кость для поделок и рукоятей.' },
    hide:    { cat: 'beast', rar: 2, name: 'Шкура',       price: 8,  desc: 'Целая шкура без дыр. Пойдёт на кожу.' },
    fang:    { cat: 'beast', rar: 3, name: 'Клык',        price: 15, desc: 'Острый клык — трофей опытного охотника.' },
    // птицы
    feather: { cat: 'bird', rar: 0, name: 'Перо',           price: 4,  desc: 'Лёгкое перо для стрел и письма.' },
    egg:     { cat: 'bird', rar: 1, name: 'Яйцо',           price: 7,  desc: 'Свежее яйцо. Повара в деревне будут рады.' },
    talon:   { cat: 'bird', rar: 2, name: 'Коготь',         price: 12, desc: 'Изогнутый коготь хищной птицы.' },
    goldfeather: { cat: 'bird', rar: 3, name: 'Сияющее перо', price: 24, desc: 'Перо отливает золотом даже в тени.' },
    // гуманоиды
    cloth:   { cat: 'humanoid', rar: 0, name: 'Обрывок ткани',  price: 7,  desc: 'Кусок плаща. Сгодится на заплатки.' },
    rustknife: { cat: 'humanoid', rar: 1, name: 'Ржавый кинжал', price: 12, desc: 'Старый, но кузнец переплавит.' },
    belt:    { cat: 'humanoid', rar: 2, name: 'Кожаный пояс',   price: 18, desc: 'Добротный пояс с медной пряжкой.' },
    amulet:  { cat: 'humanoid', rar: 3, name: 'Амулет',         price: 35, desc: 'Зелёный камень в оправе. Ценится у торговцев.' },
    // элементали
    ember:   { cat: 'elemental', rar: 0, name: 'Тлеющий уголь',  price: 14, desc: 'Не гаснет и греет руки.' },
    shard:   { cat: 'elemental', rar: 1, name: 'Осколок камня',  price: 18, desc: 'Осколок голема с искрой силы внутри.' },
    crystal: { cat: 'elemental', rar: 2, name: 'Кристалл воды',  price: 26, desc: 'Холодный кристалл, внутри плещется вода.' },
    core:    { cat: 'elemental', rar: 3, name: 'Ядро стихии',    price: 60, desc: 'Сердце элементаля. Очень редкая находка.' },
  };
  ZP.ITEM_ORDER = Object.keys(ZP.ITEMS);
  // шанс добычи: 10% у врагов 1 уровня, 30% у врагов 10 уровня
  ZP.dropChance = (L) => 0.10 + ((Math.max(1, Math.min(10, L)) - 1) * 0.20) / 9;
})(window.ZP);
