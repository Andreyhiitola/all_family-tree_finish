#!/bin/bash

# ============================================================================
# АВТОМАТИЧЕСКАЯ УСТАНОВКА PROFILEMODAL
# ============================================================================

echo "🚀 Установка ProfileModal..."
echo ""

# Переходим в папку проекта
cd ~/Desktop/all_family-tree_finish || {
    echo "❌ Папка проекта не найдена!"
    exit 1
}

# Определяем откуда брать файлы
SOURCE_DIR=""

if [ -f "ProfileModal.js" ]; then
    SOURCE_DIR="."
    echo "📂 Файлы найдены в текущей папке"
elif [ -f "$HOME/Downloads/ProfileModal.js" ]; then
    SOURCE_DIR="$HOME/Downloads"
    echo "📂 Файлы найдены в Downloads"
else
    echo "❌ Файлы не найдены!"
    echo "Поместите файлы в папку проекта или в Downloads"
    exit 1
fi

echo ""

# ============================================================================
# УСТАНОВКА ФАЙЛОВ
# ============================================================================

echo "📦 Перемещение файлов..."

# 1. ProfileModal.js
if [ -f "$SOURCE_DIR/ProfileModal.js" ]; then
    mv "$SOURCE_DIR/ProfileModal.js" src/ui/
    echo "✅ ProfileModal.js → src/ui/"
else
    echo "⚠️  ProfileModal.js не найден"
fi

# 2. table-FIXED.js (заменяет table.js)
if [ -f "$SOURCE_DIR/table-FIXED.js" ]; then
    if [ -f "src/ui/table.js" ]; then
        mv src/ui/table.js src/ui/table.js.backup
        echo "📦 Создан backup: src/ui/table.js.backup"
    elif [ -f "src/table.js" ]; then
        mv src/table.js src/table.js.backup
        echo "📦 Создан backup: src/table.js.backup"
    fi
    
    # Определяем куда класть table.js
    if [ -d "src/ui" ]; then
        mv "$SOURCE_DIR/table-FIXED.js" src/ui/table.js
        echo "✅ table-FIXED.js → src/ui/table.js"
    else
        mv "$SOURCE_DIR/table-FIXED.js" src/table.js
        echo "✅ table-FIXED.js → src/table.js"
    fi
else
    echo "⚠️  table-FIXED.js не найден"
fi

# 3. profile-modal-styles.css
if [ -f "$SOURCE_DIR/profile-modal-styles.css" ]; then
    mv "$SOURCE_DIR/profile-modal-styles.css" ./
    echo "✅ profile-modal-styles.css → корень проекта"
else
    echo "⚠️  profile-modal-styles.css не найден"
fi

# 4. app-profilemodal-integration.js (опционально)
if [ -f "$SOURCE_DIR/app-profilemodal-integration.js" ]; then
    mv "$SOURCE_DIR/app-profilemodal-integration.js" src/ui/
    echo "✅ app-profilemodal-integration.js → src/ui/"
fi

echo ""

# ============================================================================
# ПРОВЕРКА УСТАНОВКИ
# ============================================================================

echo "🔍 Проверка установки..."
echo ""

ALL_OK=true

if [ -f "src/ui/ProfileModal.js" ]; then
    echo "✅ ProfileModal.js установлен"
else
    echo "❌ ProfileModal.js НЕ установлен"
    ALL_OK=false
fi

if [ -f "src/ui/table.js" ] || [ -f "src/table.js" ]; then
    echo "✅ table.js установлен"
else
    echo "❌ table.js НЕ установлен"
    ALL_OK=false
fi

if [ -f "profile-modal-styles.css" ]; then
    echo "✅ profile-modal-styles.css установлен"
else
    echo "❌ profile-modal-styles.css НЕ установлен"
    ALL_OK=false
fi

echo ""

# ============================================================================
# ПРОВЕРКА index.html
# ============================================================================

echo "📝 Проверка index.html..."
echo ""

if grep -q "profile-modal-styles.css" index.html; then
    echo "✅ CSS подключен в index.html"
else
    echo "⚠️  CSS НЕ подключен в index.html"
    echo ""
    echo "Добавьте в <head>:"
    echo '<link rel="stylesheet" href="profile-modal-styles.css">'
    echo ""
fi

if grep -q "ProfileModal.js" index.html; then
    echo "✅ ProfileModal.js подключен в index.html"
else
    echo "⚠️  ProfileModal.js НЕ подключен в index.html"
    echo ""
    echo "Добавьте перед app.js:"
    echo '<script src="src/ui/ProfileModal.js"></script>'
    echo ""
fi

echo ""

# ============================================================================
# ФИНАЛЬНЫЕ ИНСТРУКЦИИ
# ============================================================================

if [ "$ALL_OK" = true ]; then
    echo "🎉 ВСЁ УСТАНОВЛЕНО!"
    echo ""
    echo "📋 ДАЛЬНЕЙШИЕ ШАГИ:"
    echo ""
    echo "1. Откройте index.html и проверьте подключение файлов:"
    echo "   • <link rel='stylesheet' href='profile-modal-styles.css'>"
    echo "   • <script src='src/ui/ProfileModal.js'></script>"
    echo ""
    echo "2. Добавьте в конец src/ui/app.js:"
    echo "   • Скопируйте код из app-profilemodal-integration.js"
    echo "   • Или минимум: window.profileModal = new ProfileModal(dataManager)"
    echo ""
    echo "3. Перезапустите сервер:"
    echo "   python3 -m http.server 8760"
    echo ""
    echo "4. Протестируйте в консоли браузера:"
    echo "   window.debugProfile.test()"
    echo ""
else
    echo "⚠️  УСТАНОВКА НЕПОЛНАЯ"
    echo ""
    echo "Проверьте:"
    echo "1. Файлы в правильной папке?"
    echo "2. Имена файлов правильные?"
    echo ""
fi

echo "════════════════════════════════════════"
echo "📖 Полная инструкция: PROFILEMODAL-INSTALLATION.md"
echo "════════════════════════════════════════"
