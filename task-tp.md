1. Добавлю HTML-элементы в `index.html`:
       * Кнопку "Save as template".
       * Поле для ввода имени шаблона.
       * Контейнер для отображения сохраненных шаблонов.


   2. Модифицирую `src/js/gui.ts`:
       * `createSendControls()`: Добавлю в этот метод создание
         кнопки "Save as template" и контейнера для шаблонов.
       * `addEventListeners()`: Добавлю обработчики событий для:
           * Кнопки сохранения шаблона.
           * Кнопок для применения сохраненных шаблонов.
       * Создам новые методы:
           * saveTemplate(): Будет собирать data-key всех отмеченных
              чекбоксов и сохранять их в localStorage под введенным
             именем.
           * loadTemplate(templateName): Будет загружать шаблон из
             localStorage, снимать все текущие отметки и отмечать
             чекбоксы согласно шаблону.
           * renderTemplates(): Будет отрисовывать кнопки для
             каждого сохраненного в localStorage шаблона.


   3. Хранение данных: Шаблоны будут храниться в localStorage
      браузера. Это самый простой способ обеспечить их
      персистентность без необходимости изменять серверную часть.