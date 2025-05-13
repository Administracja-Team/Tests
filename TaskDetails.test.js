import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import TaskDetails from '../views/TaskDetails.vue';
import { useToast } from 'primevue/usetoast';
import * as api from '../services/api';

// Мокаем PrimeVue компоненты
vi.mock('primevue/button', () => ({
  default: {
    template: '<button class="p-button"><slot></slot></button>',
    props: ['icon', 'label', 'class'],
  },
}));
vi.mock('primevue/avatar', () => ({
  default: {
    template: '<div class="p-avatar"></div>',
    props: ['label', 'image', 'size', 'shape'],
  },
}));

// Мокаем useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Мокаем API-сервисы
vi.mock('../services/api', () => ({
  getMemberAvatar: vi.fn(() => Promise.resolve('mocked-avatar-url')),
  changeTaskStatus: vi.fn(() => Promise.resolve()),
}));

describe('TaskDetails.vue', () => {
  // Базовые пропсы для тестов
  const defaultProps = {
    taskData: {
      id: 1,
      name: 'Test Task',
      description: 'Test Description',
      priority: 'MEDIUM',
      status: 'TODO',
      implementers: [{ id: 1 }],
    },
    projectId: 1,
    sprintId: 1,
    projectData: {
      others: [
        {
          member_id: 1,
          system_role: 'MEMBER',
          descriptive_role: 'Developer',
          user: { username: 'user1', name: 'User', surname: 'One' },
        },
      ],
    },
  };

  // Хелпер для монтирования компонента
  const mountComponent = (props = {}) => {
    const wrapper = mount(TaskDetails, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Button: false,
          Avatar: false,
        },
      },
    });
    // Логируем HTML для отладки
    console.log(wrapper.html());
    return wrapper;
  };

  it('рендерит информацию о задаче', async () => {
    const wrapper = mountComponent();
    await nextTick(); // Ждём завершения реактивных обновлений
    expect(wrapper.find('.task-title').text()).toBe('Test Task');
    expect(wrapper.find('.description-text').text()).toBe('Test Description');
    expect(wrapper.find('.priority-plaque').text()).toBe('Medium');
    expect(wrapper.find('.priority-plaque').classes()).toContain('priority-medium');
  });

  it('форматирует приоритет и классы корректно', async () => {
    const wrapper = mountComponent({
      taskData: { ...defaultProps.taskData, priority: 'HIGH' },
    });
    await nextTick();
    expect(wrapper.find('.priority-plaque').text()).toBe('High');
    expect(wrapper.find('.priority-plaque').classes()).toContain('priority-high');
  });

  it('закрывает детали при клике на кнопку закрытия', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const closeButton = wrapper.find('.task-close-button');
    await closeButton.trigger('click');
    expect(wrapper.emitted('close-details')).toBeTruthy();
  });

  it('устанавливает статус при клике на кнопку статуса', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const statusButtons = wrapper.findAll('.status-button');
    expect(statusButtons).toHaveLength(3); // TODO, IN_PROGRESS, DONE
    await statusButtons[1].trigger('click'); // Клик на IN_PROGRESS
    expect(wrapper.vm.taskStatus).toBe('IN_PROGRESS');
    expect(statusButtons[1].classes()).toContain('active');
    expect(api.changeTaskStatus).toHaveBeenCalledWith(
      defaultProps.projectId,
      defaultProps.sprintId,
      defaultProps.taskData.id,
      'IN_PROGRESS'
    );
    expect(wrapper.emitted('task-status-changed')).toBeTruthy();
    expect(wrapper.emitted('task-status-changed')[0]).toEqual([
      {
        taskId: defaultProps.taskData.id,
        sprintId: defaultProps.sprintId,
        newStatus: 'IN_PROGRESS',
      },
    ]);
  });
});