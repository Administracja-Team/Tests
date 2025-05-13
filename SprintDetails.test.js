import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import SprintDetails from '../views/SprintDetails.vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import * as api from '../services/api';

// Мокаем PrimeVue компоненты
vi.mock('primevue/button', () => ({
  default: {
    template: '<button class="p-button"><slot></slot></button>',
    props: ['icon', 'label', 'class'],
  },
}));
vi.mock('primevue/confirmdialog', () => ({
  default: {
    template: '<div class="p-confirm-dialog"></div>',
  },
}));

// Мокаем useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Мокаем useConfirm
vi.mock('primevue/useconfirm', () => ({
  useConfirm: vi.fn(() => ({
    require: vi.fn(),
  })),
}));

// Мокаем API-сервисы
vi.mock('../services/api', () => ({
  getSprintDetails: vi.fn(() =>
    Promise.resolve({
      id: 1,
      name: 'Test Sprint',
      description: 'Test Description',
      tasks: [
        { id: 1, name: 'Task 1', priority: 'HIGH', is_mine: true },
        { id: 2, name: 'Task 2', priority: 'MEDIUM', is_mine: false },
      ],
      start_at: '2023-10-01T00:00:00Z',
      end_at: '2023-10-10T00:00:00Z',
      done_percents: 50,
    })
  ),
  deleteSprint: vi.fn(() => Promise.resolve()),
}));

describe('SprintDetails.vue', () => {
  // Базовые пропсы для тестов
  const defaultProps = {
    sprintData: {
      id: 1,
      name: 'Test Sprint',
      description: 'Test Description',
      tasks: [
        { id: 1, name: 'Task 1', priority: 'HIGH', is_mine: true },
        { id: 2, name: 'Task 2', priority: 'MEDIUM', is_mine: false },
      ],
      start_time: '2023-10-01T00:00:00Z',
      end_time: '2023-10-10T00:00:00Z',
    },
    projectId: 1,
    isOwner: false,
  };

  // Хелпер для монтирования компонента
  const mountComponent = (props = {}) => {
    const wrapper = mount(SprintDetails, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Button: false,
          ConfirmDialog: false,
        },
      },
    });
    // Логируем HTML для отладки
    console.log(wrapper.html());
    return wrapper;
  };

  it('рендерит информацию о спринте', async () => {
    const wrapper = mountComponent();
    await nextTick(); // Ждём завершения реактивных обновлений
    expect(wrapper.find('.sprint-title').text()).toBe('Test Sprint');
    expect(wrapper.find('.description-text').text()).toBe('Test Description');
    expect(wrapper.find('.term-date').text()).toBe('01/10/23 - 10/10/23');
    expect(wrapper.findAll('.task-item')).toHaveLength(2);
    expect(wrapper.find('.task-name').text()).toBe('Task 1');
    expect(wrapper.find('.task-priority').text()).toBe('High');
    expect(wrapper.find('.task-content').classes()).toContain('priority-high');
  });

  it('форматирует приоритет и классы корректно', async () => {
    const wrapper = mountComponent({
      sprintData: {
        ...defaultProps.sprintData,
        tasks: [{ id: 1, name: 'Task 1', priority: 'LOW', is_mine: true }],
      },
    });
    await nextTick();
    expect(wrapper.find('.task-priority').text()).toBe('Low');
    expect(wrapper.find('.task-content').classes()).toContain('priority-low');
  });

  it('закрывает детали при клике на кнопку закрытия', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const closeButton = wrapper.find('.sprint-close-button');
    await closeButton.trigger('click');
    expect(wrapper.emitted('close-details')).toBeTruthy();
  });

  it('открывает детали задачи для своей задачи', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const taskItem = wrapper.findAll('.task-item').at(0); // Task 1 (is_mine: true)
    await taskItem.trigger('click');
    expect(wrapper.emitted('show-task-details')).toBeTruthy();
    expect(wrapper.emitted('show-task-details')[0]).toEqual([defaultProps.sprintData.tasks[0]]);
  });

  it('показывает уведомление при попытке открыть чужую задачу без прав владельца', async () => {
    const wrapper = mountComponent({ isOwner: false });
    await nextTick();
    const taskItem = wrapper.findAll('.task-item').at(1); // Task 2 (is_mine: false)
    await taskItem.trigger('click');
    expect(wrapper.emitted('show-task-details')).toBeFalsy();
    expect(useToast().add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Access Denied',
      detail: 'You cannot open tasks that are not assigned to you',
      life: 3000,
    });
  });
});