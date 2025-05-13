import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import SprintForm from '../views/SprintForm.vue';
import { useToast } from 'primevue/usetoast';
import { useRoute } from 'vue-router';
import * as api from '../services/api';

// Мокаем PrimeVue компоненты
vi.mock('primevue/button', () => ({
  default: {
    template: '<button class="p-button"><slot></slot></button>',
    props: ['icon', 'label', 'class'],
  },
}));
vi.mock('primevue/inputtext', () => ({
  default: {
    template: '<input class="p-inputtext" v-bind="$attrs" />',
    props: ['modelValue'],
  },
}));
vi.mock('primevue/textarea', () => ({
  default: {
    template: '<textarea class="p-textarea" v-bind="$attrs"></textarea>',
    props: ['modelValue', 'autoResize', 'rows'],
  },
}));
vi.mock('primevue/calendar', () => ({
  default: {
    template: '<input class="p-calendar" v-bind="$attrs" />',
    props: ['modelValue', 'showIcon', 'dateFormat'],
  },
}));

// Мокаем TaskDialog.vue
vi.mock('../components/TaskDialog.vue', () => ({
  default: {
    template: '<div class="task-dialog-mock"></div>',
    props: ['show', 'participants', 'task', 'mode'],
    emits: ['update:show', 'add-task', 'update-task'],
  },
}));

// Мокаем useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Мокаем useRoute
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { id: '1' },
  })),
}));

// Мокаем API-сервис
vi.mock('../services/api', () => ({
  createSprint: vi.fn(() => Promise.resolve({ id: 1, name: 'Test Sprint' })),
}));

describe('SprintForm.vue', () => {
  // Базовые пропсы для тестов
  const defaultProps = {
    projectData: {
      project_id: 1,
      owner: 'user1',
      ownerFullName: 'User One',
      ownerMemberId: '1',
      others: [
        {
          member_id: '2',
          system_role: 'MEMBER',
          user: { username: 'user2', name: 'User', surname: 'Two' },
        },
      ],
    },
  };

  // Хелпер для монтирования компонента
  const mountComponent = (props = {}) => {
    const wrapper = mount(SprintForm, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Button: false,
          InputText: false,
          Textarea: false,
          Calendar: false,
          TaskDialog: false,
        },
      },
    });
    // Логируем HTML для отладки
    console.log(wrapper.html());
    return wrapper;
  };

  it('рендерит форму для создания спринта', async () => {
    const wrapper = mountComponent();
    await nextTick(); // Ждём завершения реактивных обновлений
    expect(wrapper.find('.sprint-title').text()).toBe('New sprint');
    expect(wrapper.find('input[placeholder="Sprint name"]').exists()).toBe(true);
    expect(wrapper.find('textarea[placeholder="Sprint description"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Start date"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="End date"]').exists()).toBe(true);
    expect(wrapper.find('button').text()).toContain('Create a sprint');
  });

  it('закрывает форму при клике на кнопку закрытия', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const closeButton = wrapper.find('.sprint-close-button');
    await closeButton.trigger('click');
    expect(wrapper.emitted('close-form')).toBeTruthy();
    expect(wrapper.vm.sprintName).toBe(''); // Проверяем сброс формы
    expect(wrapper.vm.tasks).toEqual([]);
  });

  it('добавляет задачу через TaskDialog', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const addTaskButton = wrapper.find('.add-task-button');
    await addTaskButton.trigger('click');
    expect(wrapper.vm.showTaskForm).toBe(true);

    // Симулируем эмиссию события add-task из TaskDialog
    const newTask = {
      name: 'Test Task',
      description: 'Test Description',
      priority: 'MEDIUM',
      end_at: '2023-10-02T00:00:00Z',
      implementer_member_ids: ['1'],
    };
    wrapper.findComponent({ name: 'TaskDialog' }).vm.$emit('add-task', newTask);
    await nextTick();

    expect(wrapper.vm.tasks).toHaveLength(1);
    expect(wrapper.vm.tasks[0]).toMatchObject(newTask);
    expect(useToast().add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Task Added',
      detail: 'Test Task added to sprint',
      life: 3000,
    });
  });

  it('удаляет задачу при клике на кнопку удаления', async () => {
    const wrapper = mountComponent();
    await nextTick();

    // Добавляем задачу вручную
    const task = {
      name: 'Test Task',
      description: 'Test Description',
      priority: 'MEDIUM',
      end_at: '2023-10-02T00:00:00Z',
    };
    wrapper.vm.tasks = [task];
    await nextTick();

    const removeButton = wrapper.find('.remove-task-button');
    await removeButton.trigger('click');
    expect(wrapper.vm.tasks).toHaveLength(0);
    expect(useToast().add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Task Removed',
      detail: 'Test Task removed from sprint',
      life: 3000,
    });
  });
});